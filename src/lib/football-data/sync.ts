import { db, schema } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";
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

const MAX_VARS = 90;

export interface SyncResult {
  teamsTouched: number;
  matchesInserted: number;
  matchesUpdated: number;
  pointsRecomputed: number;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
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

  // ── 1. Pre-load existing teams ──
  const existingTeams = await db.select().from(schema.teams);
  const teamByCodeLocal = new Map(existingTeams.map((r) => [r.code, r]));
  const teamByExtIdLocal = new Map(existingTeams.filter((r) => r.externalId != null).map((r) => [r.externalId!, r]));

  // ── 2. Resolve externalId conflicts (chunked for D1 variable limit) ──
  const conflictIds: number[] = [];
  for (const [externalId, t] of teamMap) {
    const tlaTrim = t.tla?.trim() ?? "";
    const nameTrim = t.name?.trim() ?? "";
    if (!tlaTrim && !nameTrim) continue;
    const code = (tlaTrim.length > 0 ? tlaTrim : `T${externalId}`).toUpperCase();
    const holder = teamByExtIdLocal.get(externalId);
    if (holder && holder.code !== code) {
      conflictIds.push(holder.id);
    }
  }
  for (const ids of chunk(conflictIds, MAX_VARS)) {
    await db.update(schema.teams).set({ externalId: null }).where(inArray(schema.teams.id, ids));
  }

  // ── 3. Team upserts — run sequentially to stay under D1 variable limit ──
  let teamsTouched = 0;
  for (const [externalId, t] of teamMap) {
    const tlaTrim = t.tla?.trim() ?? "";
    const nameTrim = t.name?.trim() ?? "";
    if (!tlaTrim && !nameTrim) continue;

    const code = (tlaTrim.length > 0 ? tlaTrim : `T${externalId}`).toUpperCase();
    const safeName = nameTrim.length > 0 ? nameTrim : `Selecao ${externalId}`;
    const namePt = TEAM_NAMES_PT[code] ?? safeName;
    const nameEs = TEAM_NAMES_ES[code] ?? safeName;

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
    teamsTouched++;
  }

  // ── 4. Build teamByExternal from fresh data ──
  const teamRows = await db.select().from(schema.teams);
  const teamByExternal = new Map(teamRows.filter((r) => r.externalId).map((r) => [r.externalId!, r.id]));

  // ── 5. Pre-load relevant matches (chunked for D1 variable limit) ──
  const matchExtIds = data.matches.map((m) => String(m.id));
  const existingMatches: typeof schema.matches.$inferSelect[] = [];
  for (const ids of chunk(matchExtIds, MAX_VARS)) {
    const rows = await db.select().from(schema.matches).where(inArray(schema.matches.externalId, ids));
    existingMatches.push(...rows);
  }
  const matchByExtId = new Map(existingMatches.map((r) => [r.externalId, r]));

  // ── 6. Match upserts — sequential to stay under D1 variable limit ──
  let inserted = 0;
  let updated = 0;
  const newlyFinishedIds: number[] = [];

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
    const existingId = matchByExtId.get(externalId)?.id;
    const becomesFinished = status === "finished";

    if (matchByExtId.has(externalId)) {
      updated++;
    } else {
      inserted++;
    }

    if (becomesFinished && !wasFinished && existingId) {
      newlyFinishedIds.push(existingId);
    }

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

    await db.insert(schema.matches).values({ externalId, ...fields })
      .onConflictDoUpdate({
        target: schema.matches.externalId,
        set: fields,
      });
  }

  // ── 7. Compute points for newly finished matches ──
  let pointsRecomputed = 0;
  for (const mid of newlyFinishedIds) {
    await computeMatchPoints(mid);
    pointsRecomputed++;
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