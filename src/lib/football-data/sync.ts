import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { FootballDataClient, mapStage, mapStatus, groupCode } from "./client";
import { computeMatchPoints, refreshRankingsSnapshot } from "@/lib/scoring/compute";
import { log } from "@/lib/observability/logger";

const TEAM_NAMES_PT: Record<string, string> = {
  ARG: "Argentina", BRA: "Brasil", URU: "Uruguai", PAR: "Paraguai", COL: "Colômbia",
  ECU: "Equador", VEN: "Venezuela", BOL: "Bolívia", MEX: "México", CAN: "Canadá",
  USA: "Estados Unidos", JAM: "Jamaica", CRC: "Costa Rica", PAN: "Panamá", HAI: "Haiti",
  HON: "Honduras", JPN: "Japão", KOR: "Coreia do Sul", IRN: "Irã", KSA: "Arábia Saudita",
  AUS: "Austrália", UZB: "Uzbequistão", QAT: "Catar", JOR: "Jordânia",
  RSA: "África do Sul", MAR: "Marrocos", TUN: "Tunísia", EGY: "Egito", ALG: "Argélia",
  CIV: "Costa do Marfim", SEN: "Senegal", GHA: "Gana", CMR: "Camarões", NGA: "Nigéria",
  CPV: "Cabo Verde",
  ENG: "Inglaterra", FRA: "França", ESP: "Espanha", GER: "Alemanha", ITA: "Itália",
  POR: "Portugal", NED: "Holanda", BEL: "Bélgica", CRO: "Croácia", SUI: "Suíça",
  AUT: "Áustria", DEN: "Dinamarca", SWE: "Suécia", POL: "Polônia", NOR: "Noruega",
  CZE: "República Tcheca", SCO: "Escócia", WAL: "País de Gales", IRL: "Irlanda",
  TUR: "Turquia", SRB: "Sérvia", UKR: "Ucrânia", BIH: "Bósnia",
  NZL: "Nova Zelândia",
};

const TEAM_NAMES_ES: Record<string, string> = {
  USA: "Estados Unidos", RSA: "Sudáfrica", MAR: "Marruecos", KOR: "Corea del Sur",
  CZE: "República Checa", BIH: "Bosnia",
};

export interface SyncResult {
  teamsTouched: number;
  matchesInserted: number;
  matchesUpdated: number;
  pointsRecomputed: number;
}

export async function syncWorldCupFromFootballData(apiKey: string): Promise<SyncResult> {
  const startedAt = Date.now();
  const fd = new FootballDataClient(apiKey);
  const data = await fd.getWorldCupMatches(2026);

  const teamMap = new Map<number, { tla: string; name: string; crest: string | null; group: string | null }>();
  for (const m of data.matches) {
    const grp = groupCode(m.group);
    if (!teamMap.has(m.homeTeam.id)) {
      teamMap.set(m.homeTeam.id, { tla: m.homeTeam.tla, name: m.homeTeam.name, crest: m.homeTeam.crest, group: grp });
    }
    if (!teamMap.has(m.awayTeam.id)) {
      teamMap.set(m.awayTeam.id, { tla: m.awayTeam.tla, name: m.awayTeam.name, crest: m.awayTeam.crest, group: grp });
    }
  }

  // Pre-load all existing teams so we can resolve cross-constraint conflicts
  // before upserting. Both `code` and `externalId` are UNIQUE — if a row
  // already holds our target externalId under a different code, the INSERT
  // would violate UNIQUE(external_id) even though ON CONFLICT targets code.
  const existingTeams = await db.select().from(schema.teams);
  const teamByCodeLocal = new Map(existingTeams.map((r) => [r.code, r]));
  const teamByExtIdLocal = new Map(existingTeams.filter((r) => r.externalId != null).map((r) => [r.externalId!, r]));

  let teamsTouched = 0;
  for (const [externalId, t] of teamMap) {
    const tlaTrim = t.tla?.trim() ?? "";
    const nameTrim = t.name?.trim() ?? "";
    if (!tlaTrim && !nameTrim) continue;

    const code = (tlaTrim.length > 0 ? tlaTrim : `T${externalId}`).toUpperCase();
    const safeName = nameTrim.length > 0 ? nameTrim : `Selecao ${externalId}`;
    const namePt = TEAM_NAMES_PT[code] ?? safeName;
    const nameEs = TEAM_NAMES_ES[code] ?? safeName;

    // If another team row holds our target externalId under a different code,
    // nullify that row's externalId first — otherwise the INSERT would violate
    // UNIQUE(external_id) and ON CONFLICT(code) doesn't catch that.
    const holder = teamByExtIdLocal.get(externalId);
    if (holder && holder.code !== code) {
      await db.update(schema.teams).set({ externalId: null }).where(eq(schema.teams.id, holder.id));
      teamByExtIdLocal.delete(externalId);
      // Also remove stale entry from code map if present
      teamByCodeLocal.delete(holder.code);
    }

    // Atomic upsert by `code`. If the code already exists (common path during
    // re-sync), UPDATE including the correct externalId. If it doesn't exist,
    // INSERT. The externalId conflict was cleared above.
    await db.insert(schema.teams).values({
      externalId,
      code,
      namePt,
      nameEn: safeName,
      nameEs,
      flagUrl: t.crest,
      groupCode: t.group,
    }).onConflictDoUpdate({
      target: schema.teams.code,
      set: {
        externalId,
        namePt,
        nameEn: safeName,
        nameEs,
        flagUrl: t.crest,
        groupCode: t.group,
      },
    });

    // Keep local maps in sync so later iterations see the upserted row
    teamByCodeLocal.set(code, { id: holder?.id ?? teamByCodeLocal.get(code)?.id ?? 0, code, externalId, namePt, nameEn: safeName, nameEs, flagUrl: t.crest, groupCode: t.group });
    teamByExtIdLocal.set(externalId, teamByCodeLocal.get(code)!);
    teamsTouched++;
  }

  const teamRows = await db.select().from(schema.teams);
  const teamByExternal = new Map(teamRows.filter((r) => r.externalId).map((r) => [r.externalId!, r.id]));

  // Pre-fetch existing matches to track finish transitions without risking
  // race-condition INSERT failures on the UNIQUE(external_id) constraint.
  const existingMatches = await db.select().from(schema.matches);
  const matchByExtId = new Map(existingMatches.map((r) => [r.externalId, r]));

  let inserted = 0;
  let updated = 0;
  let pointsRecomputed = 0;

  for (const m of data.matches) {
    const externalId = String(m.id);
    const homeId = teamByExternal.get(m.homeTeam.id);
    const awayId = teamByExternal.get(m.awayTeam.id);
    if (!homeId || !awayId) continue;

    const scheduledAt = Math.floor(new Date(m.utcDate).getTime() / 1000);
    const stage = mapStage(m.stage);
    const status = mapStatus(m.status);
    const grp = groupCode(m.group);

    const wasFinished = matchByExtId.get(externalId)?.status === "finished";
    const becomesFinished = status === "finished";
    const existingId = matchByExtId.get(externalId)?.id;

    const fields = {
      stage,
      groupCode: grp,
      round: stage === "group" ? m.matchday : null,
      homeTeamId: homeId,
      awayTeamId: awayId,
      scheduledAt,
      status,
      homeScore: m.score.fullTime.home,
      awayScore: m.score.fullTime.away,
      homeScoreEt: m.score.extraTime?.home ?? null,
      awayScoreEt: m.score.extraTime?.away ?? null,
      homeScorePen: m.score.penalties?.home ?? null,
      awayScorePen: m.score.penalties?.away ?? null,
      finishedAt: m.status === "FINISHED" ? Math.floor(new Date(m.lastUpdated).getTime() / 1000) : null,
    };

    // Atomic upsert by externalId (UNIQUE). Avoids race-condition where
    // concurrent syncs both SELECT → neither finds the match → both
    // INSERT → UNIQUE constraint failure aborts the whole sync.
    await db.insert(schema.matches).values({ externalId, ...fields })
      .onConflictDoUpdate({
        target: schema.matches.externalId,
        set: fields,
      });

    if (matchByExtId.has(externalId)) {
      updated++;
    } else {
      inserted++;
    }

    if (becomesFinished && !wasFinished && existingId) {
      await computeMatchPoints(existingId);
      pointsRecomputed++;
    }
  }

  if (pointsRecomputed > 0) await refreshRankingsSnapshot();

  log.info("football-data.sync", {
    teamsTouched,
    matchesInserted: inserted,
    matchesUpdated: updated,
    pointsRecomputed,
    latencyMs: Date.now() - startedAt,
  });

  return {
    teamsTouched,
    matchesInserted: inserted,
    matchesUpdated: updated,
    pointsRecomputed,
  };
}
