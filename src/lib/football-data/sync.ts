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

  let teamsTouched = 0;
  for (const [externalId, t] of teamMap) {
    // Skip placeholder teams that Football-Data returns for not-yet-defined
    // knockout fixtures (no tla, no proper name). Inserting them creates
    // sentinel rows like TNULL/Selecao that later collide on UNIQUE(code).
    const tlaTrim = t.tla?.trim() ?? "";
    const nameTrim = t.name?.trim() ?? "";
    if (!tlaTrim && !nameTrim) continue;

    const code = (tlaTrim.length > 0 ? tlaTrim : `T${externalId}`).toUpperCase();
    const safeName = nameTrim.length > 0 ? nameTrim : `Selecao ${externalId}`;
    const namePt = TEAM_NAMES_PT[code] ?? safeName;
    const nameEs = TEAM_NAMES_ES[code] ?? safeName;

    // Upsert by `code` (the UNIQUE constraint in the schema). The previous
    // version looked up by externalId, which breaks when Football-Data
    // renumbers IDs or introduces placeholders mid-tournament — the INSERT
    // then collides on UNIQUE(code) and aborts the whole sync.
    const existing = await db
      .select()
      .from(schema.teams)
      .where(eq(schema.teams.code, code))
      .limit(1)
      .then((r) => r[0]);

    if (existing) {
      await db
        .update(schema.teams)
        .set({
          externalId,
          namePt,
          nameEn: safeName,
          nameEs,
          flagUrl: t.crest,
          groupCode: t.group,
        })
        .where(eq(schema.teams.code, code));
    } else {
      await db.insert(schema.teams).values({
        externalId,
        code,
        namePt,
        nameEn: safeName,
        nameEs,
        flagUrl: t.crest,
        groupCode: t.group,
      });
    }
    teamsTouched++;
  }

  const teamRows = await db.select().from(schema.teams);
  const teamByExternal = new Map(teamRows.filter((r) => r.externalId).map((r) => [r.externalId!, r.id]));

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

    const existing = await db.select().from(schema.matches).where(eq(schema.matches.externalId, externalId)).limit(1).then((r) => r[0]);
    const wasFinished = existing?.status === "finished";
    const becomesFinished = status === "finished";

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

    if (existing) {
      await db.update(schema.matches).set(fields).where(eq(schema.matches.externalId, externalId));
      updated++;
      if (becomesFinished && !wasFinished) {
        await computeMatchPoints(existing.id);
        pointsRecomputed++;
      }
    } else {
      await db.insert(schema.matches).values({ externalId, ...fields });
      inserted++;
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
