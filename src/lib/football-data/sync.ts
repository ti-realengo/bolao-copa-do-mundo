import { db, runBatch, schema } from "@/lib/db";
import { and, eq, inArray, isNull } from "drizzle-orm";
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

// True when any persisted match column differs from the incoming data.
// Lets the sync skip writes for the (common) case where nothing changed.
function matchChanged(
  prev: typeof schema.matches.$inferSelect,
  next: typeof schema.matches.$inferInsert,
): boolean {
  return (
    prev.stage !== next.stage ||
    prev.groupCode !== next.groupCode ||
    prev.round !== next.round ||
    prev.homeTeamId !== next.homeTeamId ||
    prev.awayTeamId !== next.awayTeamId ||
    prev.scheduledAt !== next.scheduledAt ||
    prev.status !== next.status ||
    prev.homeScore !== next.homeScore ||
    prev.awayScore !== next.awayScore ||
    prev.homeScoreEt !== next.homeScoreEt ||
    prev.awayScoreEt !== next.awayScoreEt ||
    prev.homeScorePen !== next.homeScorePen ||
    prev.awayScorePen !== next.awayScorePen ||
    prev.winnerTeamId !== next.winnerTeamId ||
    prev.finishedAt !== next.finishedAt
  );
}

export async function syncWorldCupFromFootballData(apiKey: string): Promise<SyncResult> {
  const startedAt = Date.now();
  const fd = new FootballDataClient(apiKey);
  const data = await fd.getWorldCupMatches(2026);

  const teamMap = new Map<number, { tla: string; name: string; crest: string | null; group: string | null }>();
  for (const m of data.matches) {
    const grp = groupCode(m.group);
    if (m.homeTeam.id != null && !teamMap.has(m.homeTeam.id)) {
      teamMap.set(m.homeTeam.id, { tla: m.homeTeam.tla ?? "", name: m.homeTeam.name ?? "", crest: m.homeTeam.crest, group: grp });
    }
    if (m.awayTeam.id != null && !teamMap.has(m.awayTeam.id)) {
      teamMap.set(m.awayTeam.id, { tla: m.awayTeam.tla ?? "", name: m.awayTeam.name ?? "", crest: m.awayTeam.crest, group: grp });
    }
  }

  // ── 1. Pre-load existing teams ──
  const existingTeams = await db.select().from(schema.teams);
  const teamByExtIdLocal = new Map(existingTeams.filter((r) => r.externalId != null).map((r) => [r.externalId!, r]));
  const existingTeamByCode = new Map(existingTeams.map((r) => [r.code, r]));

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

  // ── 3. Team upserts — batched via runBatch() ──
  const teamValues: { externalId: number; code: string; namePt: string; nameEn: string; nameEs: string; flagUrl: string | null; groupCode: string | null }[] = [];
  for (const [externalId, t] of teamMap) {
    const tlaTrim = t.tla?.trim() ?? "";
    const nameTrim = t.name?.trim() ?? "";
    if (!tlaTrim && !nameTrim) continue;
    const code = (tlaTrim.length > 0 ? tlaTrim : `T${externalId}`).toUpperCase();
    const safeName = nameTrim.length > 0 ? nameTrim : `Selecao ${externalId}`;
    const tv = {
      externalId,
      code,
      namePt: TEAM_NAMES_PT[code] ?? safeName,
      nameEn: safeName,
      nameEs: TEAM_NAMES_ES[code] ?? safeName,
      flagUrl: t.crest,
      groupCode: t.group,
    };
    // Skip the upsert when the stored row already matches — avoids writing all
    // ~48 teams (and building ~48 Drizzle statements) on every run.
    const prev = existingTeamByCode.get(code);
    if (
      prev &&
      prev.externalId === tv.externalId &&
      prev.namePt === tv.namePt &&
      prev.nameEn === tv.nameEn &&
      prev.nameEs === tv.nameEs &&
      prev.flagUrl === tv.flagUrl &&
      prev.groupCode === tv.groupCode
    ) {
      continue;
    }
    teamValues.push(tv);
  }
  for (const batch of chunk(teamValues, 25)) {
    await runBatch(
      batch.map((tv) =>
        db.insert(schema.teams).values(tv).onConflictDoUpdate({
          target: schema.teams.code,
          set: { externalId: tv.externalId, namePt: tv.namePt, nameEn: tv.nameEn, nameEs: tv.nameEs, flagUrl: tv.flagUrl, groupCode: tv.groupCode },
        }),
      ),
    );
  }

  // ── 4. Build teamByExternal (externalId → local id) ──
  // Start from the rows already loaded in step 1, then refresh only the codes
  // we just wrote. Avoids a full-table scan on every run (the common case where
  // nothing changed does zero extra queries).
  const teamByExternal = new Map<number, number>();
  for (const r of existingTeams) {
    if (r.externalId != null) teamByExternal.set(r.externalId, r.id);
  }
  if (teamValues.length > 0) {
    const writtenCodes = teamValues.map((tv) => tv.code);
    for (const codes of chunk(writtenCodes, MAX_VARS)) {
      const rows = await db.select().from(schema.teams).where(inArray(schema.teams.code, codes));
      for (const r of rows) {
        if (r.externalId != null) teamByExternal.set(r.externalId, r.id);
      }
    }
  }

  // ── 5. Pre-load relevant matches (chunked for D1 variable limit) ──
  const matchExtIds = data.matches.map((m) => String(m.id));
  const existingMatches: typeof schema.matches.$inferSelect[] = [];
  for (const ids of chunk(matchExtIds, MAX_VARS)) {
    const rows = await db.select().from(schema.matches).where(inArray(schema.matches.externalId, ids));
    existingMatches.push(...rows);
  }
  const matchByExtId = new Map(existingMatches.map((r) => [r.externalId, r]));

  // ── 6. Match upserts — batched via runBatch() ──
  let inserted = 0;
  let updated = 0;
  const needsScoringIds: number[] = [];

  const matchOps: (typeof schema.matches.$inferInsert)[] = [];
  for (const m of data.matches) {
    const externalId = String(m.id);
    const homeId = m.homeTeam.id != null ? teamByExternal.get(m.homeTeam.id) ?? null : null;
    const awayId = m.awayTeam.id != null ? teamByExternal.get(m.awayTeam.id) ?? null : null;

    const stage = mapStage(m.stage);
    const status = mapStatus(m.status);

    const fields = {
      externalId,
      stage,
      groupCode: groupCode(m.group),
      round: stage === "group" ? m.matchday : null,
      homeTeamId: homeId,
      awayTeamId: awayId,
      scheduledAt: Math.floor(new Date(m.utcDate).getTime() / 1000),
      status,
      homeScore: m.score.fullTime.home,
      awayScore: m.score.fullTime.away,
      homeScoreEt: m.score.extraTime?.home ?? null,
      awayScoreEt: m.score.extraTime?.away ?? null,
      homeScorePen: m.score.penalties?.home ?? null,
      awayScorePen: m.score.penalties?.away ?? null,
      winnerTeamId: m.score.winner === "HOME_TEAM" ? homeId : m.score.winner === "AWAY_TEAM" ? awayId : null,
      finishedAt: m.status === "FINISHED" ? Math.floor(new Date(m.lastUpdated).getTime() / 1000) : null,
    };

    const existing = matchByExtId.get(externalId);

    // Detect matches that need re-scoring:
    // (a) newly-finished (status transition scheduled/in-play → finished)
    // (b) already-finished but score/winner changed by the API (corrections)
    if (existing && status === "finished" && existing.status !== "finished") {
      needsScoringIds.push(existing.id);
    } else if (
      existing &&
      existing.status === "finished" &&
      status === "finished" &&
      (existing.homeScore !== fields.homeScore ||
        existing.awayScore !== fields.awayScore ||
        existing.winnerTeamId !== fields.winnerTeamId ||
        existing.stage !== fields.stage)
    ) {
      needsScoringIds.push(existing.id);
    }

    // Only write when new or actually changed — most runs touch nothing.
    if (!existing) {
      inserted++;
      matchOps.push(fields);
    } else if (matchChanged(existing, fields)) {
      updated++;
      matchOps.push(fields);
    }
  }

  for (const batch of chunk(matchOps, 25)) {
    await runBatch(
      batch.map((fields) =>
        db.insert(schema.matches).values(fields).onConflictDoUpdate({
          target: schema.matches.externalId,
          set: {
            stage: fields.stage,
            groupCode: fields.groupCode,
            round: fields.round,
            homeTeamId: fields.homeTeamId,
            awayTeamId: fields.awayTeamId,
            scheduledAt: fields.scheduledAt,
            status: fields.status,
            homeScore: fields.homeScore,
            awayScore: fields.awayScore,
            homeScoreEt: fields.homeScoreEt,
            awayScoreEt: fields.awayScoreEt,
            homeScorePen: fields.homeScorePen,
            awayScorePen: fields.awayScorePen,
            winnerTeamId: fields.winnerTeamId,
            finishedAt: fields.finishedAt,
          },
        }),
      ),
    );
  }

  // ── 7. Safety net: recover unscored predictions for finished matches ──
  // If scoring failed on a previous run (e.g. Cloudflare CPU timeout), the
  // predictions stay points IS NULL. Detect those matches and re-queue them.
  const unscoredRows = await db
    .select({ matchId: schema.predictions.matchId })
    .from(schema.predictions)
    .innerJoin(schema.matches, eq(schema.predictions.matchId, schema.matches.id))
    .where(and(eq(schema.matches.status, "finished"), isNull(schema.predictions.points)));

  const needsScoringSet = new Set(needsScoringIds);
  for (const row of unscoredRows) {
    if (!needsScoringSet.has(row.matchId)) {
      needsScoringSet.add(row.matchId);
      needsScoringIds.push(row.matchId);
    }
  }

  // ── 8. Compute points for newly finished matches ──
  let pointsRecomputed = 0;
  for (const mid of needsScoringIds) {
    await computeMatchPoints(mid);
    pointsRecomputed++;
  }

  if (pointsRecomputed > 0) await refreshRankingsSnapshot();

  log.info("football-data.sync", {
    teamsTouched: teamValues.length,
    matchesInserted: inserted,
    matchesUpdated: updated,
    pointsRecomputed,
    rescoredMatchIds: needsScoringIds,
    latencyMs: Date.now() - startedAt,
  });

  return {
    teamsTouched: teamValues.length,
    matchesInserted: inserted,
    matchesUpdated: updated,
    pointsRecomputed,
  };
}