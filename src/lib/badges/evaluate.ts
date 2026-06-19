import { db, runBatch, schema } from "@/lib/db";
import { and, eq, inArray, sql } from "drizzle-orm";
import { BADGES } from "./catalog";
import { log } from "@/lib/observability/logger";

const BATCH_CHUNK = 50;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function evaluateBadgesAfterMatch(matchId: number): Promise<number> {
  const match = await db.select().from(schema.matches).where(eq(schema.matches.id, matchId)).limit(1).then((r) => r[0]);
  if (!match || match.status !== "finished") return 0;

  const teamIds = [match.homeTeamId, match.awayTeamId].filter((id): id is number => id != null);
  const teamRows = teamIds.length > 0
    ? await db.select().from(schema.teams).where(inArray(schema.teams.id, teamIds))
    : [];
  const isBrazil = teamRows.some((t) => t.code === "BRA");

  const preds = await db.select().from(schema.predictions).where(eq(schema.predictions.matchId, matchId));
  if (preds.length === 0) return 0;

  const exactScorers = preds.filter((p) => p.isExact);
  const uniqueUserIds = [...new Set(exactScorers.map((p) => p.userId))];

  const existingBadges: { userId: string; badgeCode: string }[] = [];
  if (uniqueUserIds.length > 0) {
    for (const batch of chunk(uniqueUserIds, BATCH_CHUNK)) {
      const rows = await db
        .select({ userId: schema.achievements.userId, badgeCode: schema.achievements.badgeCode })
        .from(schema.achievements)
        .where(
          and(
            inArray(schema.achievements.userId, batch),
            inArray(schema.achievements.badgeCode, [BADGES.tarologo.code, BADGES.cravou.code]),
          ),
        );
      existingBadges.push(...rows);
    }
  }
  const hasBadge = new Set(existingBadges.map((r) => `${r.userId}:${r.badgeCode}`));

  let exactCountByUser: Map<string, number>;
  if (uniqueUserIds.length > 0) {
    const counts = await db
      .select({ userId: schema.predictions.userId, c: sql<number>`count(*)` })
      .from(schema.predictions)
      .where(and(inArray(schema.predictions.userId, uniqueUserIds), eq(schema.predictions.isExact, 1)))
      .groupBy(schema.predictions.userId);
    exactCountByUser = new Map(counts.map((r) => [r.userId, Number(r.c)]));
  } else {
    exactCountByUser = new Map();
  }

  const awards: { userId: string; badgeCode: string; unlockedAt: number; matchId: number }[] = [];
  const now = Math.floor(Date.now() / 1000);

  for (const p of exactScorers) {
    if (!hasBadge.has(`${p.userId}:${BADGES.tarologo.code}`)) {
      const count = exactCountByUser.get(p.userId) ?? 0;
      if (count >= 5) {
        hasBadge.add(`${p.userId}:${BADGES.tarologo.code}`);
        awards.push({ userId: p.userId, badgeCode: BADGES.tarologo.code, unlockedAt: now, matchId });
      }
    }
    if (isBrazil && !hasBadge.has(`${p.userId}:${BADGES.cravou.code}`)) {
      hasBadge.add(`${p.userId}:${BADGES.cravou.code}`);
      awards.push({ userId: p.userId, badgeCode: BADGES.cravou.code, unlockedAt: now, matchId });
    }
  }

  if (match.round != null && match.stage === "group") {
    const round = match.round;
    const roundMatches = await db
      .select({ id: schema.matches.id, status: schema.matches.status })
      .from(schema.matches)
      .where(and(eq(schema.matches.stage, "group"), eq(schema.matches.round, round)));
    const allFinished = roundMatches.every((m) => m.status === "finished");
    if (allFinished && roundMatches.length > 0) {
      const ids = roundMatches.map((m) => m.id);
      const stats = await db
        .select({
          userId: schema.predictions.userId,
          total: sql<number>`count(*)`,
          zeros: sql<number>`sum(case when coalesce(${schema.predictions.points}, 0) = 0 then 1 else 0 end)`,
        })
        .from(schema.predictions)
        .where(inArray(schema.predictions.matchId, ids))
        .groupBy(schema.predictions.userId);

      const zicaUserIds = stats
        .filter((s) => Number(s.total) >= 3 && Number(s.total) === Number(s.zeros))
        .map((s) => s.userId);

      if (zicaUserIds.length > 0) {
        const existingZica = await db
          .select({ userId: schema.achievements.userId })
          .from(schema.achievements)
          .where(
            and(inArray(schema.achievements.userId, zicaUserIds), eq(schema.achievements.badgeCode, BADGES.zica.code)),
          );
        const hasZica = new Set(existingZica.map((r) => r.userId));
        for (const uid of zicaUserIds) {
          if (!hasZica.has(uid)) {
            awards.push({ userId: uid, badgeCode: BADGES.zica.code, unlockedAt: now, matchId });
          }
        }
      }
    }
  }

  // Use runBatch with individual INSERTs to avoid D1 bind-variable limit
  // (multi-row INSERT with 50 rows × 4 cols = 200 variables would exceed D1's ~100 limit).
  for (const batch of chunk(awards, BATCH_CHUNK)) {
    await runBatch(
      batch.map((a) =>
        db.insert(schema.achievements).values({
          userId: a.userId,
          badgeCode: a.badgeCode,
          unlockedAt: a.unlockedAt,
          matchId: a.matchId,
        }).onConflictDoNothing(),
      ),
    );
  }

  if (awards.length > 0) {
    log.info("badges.evaluateAfterMatch", { matchId, awarded: awards.length });
  }

  await evaluateSequenciaQuente(matchId);

  return awards.length;
}

export async function evaluateSequenciaQuente(matchId: number): Promise<number> {
  const match = await db.select().from(schema.matches).where(eq(schema.matches.id, matchId)).limit(1).then((r) => r[0]);
  if (!match || match.status !== "finished") return 0;

  const finishedMatches = await db
    .select({ id: schema.matches.id, scheduledAt: schema.matches.scheduledAt })
    .from(schema.matches)
    .where(eq(schema.matches.status, "finished"))
    .orderBy(schema.matches.scheduledAt);
  const finishedIds = new Set(finishedMatches.map((m) => m.id));
  const orderedMatchIds = finishedMatches.map((m) => m.id);

  const allPreds = await db
    .select({ userId: schema.predictions.userId, matchId: schema.predictions.matchId, points: schema.predictions.points })
    .from(schema.predictions)
    .where(inArray(schema.predictions.matchId, orderedMatchIds));

  const byUser = new Map<string, Map<number, number>>();
  for (const p of allPreds) {
    let inner = byUser.get(p.userId);
    if (!inner) {
      inner = new Map();
      byUser.set(p.userId, inner);
    }
    inner.set(p.matchId, p.points ?? 0);
  }

  const candidateUserIds: string[] = [];
  for (const [userId, predMap] of byUser) {
    let streak = 0;
    for (const mid of orderedMatchIds) {
      if (predMap.has(mid)) {
        const pts = predMap.get(mid)!;
        if (pts > 0) {
          streak++;
          if (streak >= 5) {
            candidateUserIds.push(userId);
            break;
          }
        } else {
          streak = 0;
        }
      } else if (finishedIds.has(mid)) {
        streak = 0;
      }
    }
  }

  if (candidateUserIds.length === 0) return 0;

  const existing = await db
    .select({ userId: schema.achievements.userId })
    .from(schema.achievements)
    .where(
      and(inArray(schema.achievements.userId, candidateUserIds), eq(schema.achievements.badgeCode, BADGES.sequencia_quente.code)),
    );
  const hasBadge = new Set(existing.map((r) => r.userId));

  const awards: { userId: string; badgeCode: string; unlockedAt: number; matchId: number }[] = [];
  const now = Math.floor(Date.now() / 1000);

  for (const uid of candidateUserIds) {
    if (!hasBadge.has(uid)) {
      awards.push({ userId: uid, badgeCode: BADGES.sequencia_quente.code, unlockedAt: now, matchId });
    }
  }

  for (const batch of chunk(awards, BATCH_CHUNK)) {
    await runBatch(
      batch.map((a) =>
        db.insert(schema.achievements).values({
          userId: a.userId,
          badgeCode: a.badgeCode,
          unlockedAt: a.unlockedAt,
          matchId: a.matchId,
        }).onConflictDoNothing(),
      ),
    );
  }

  if (awards.length > 0) {
    log.info("badges.evaluateSequenciaQuente", { matchId, awarded: awards.length });
  }

  return awards.length;
}

export async function evaluateProfeta(): Promise<number> {
  const results = await db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.key, "special_results_json"))
    .limit(1)
    .then((r) => (r[0] ? r[0] : null));
  if (!results) return 0;

  let championTeamId: number | null = null;
  try {
    const parsed = JSON.parse(results.value);
    championTeamId = parsed.championTeamId ?? null;
  } catch {
    return 0;
  }
  if (championTeamId == null) return 0;

  const matching = await db
    .select({ userId: schema.specialPredictions.userId })
    .from(schema.specialPredictions)
    .where(eq(schema.specialPredictions.championTeamId, championTeamId));

  if (matching.length === 0) return 0;

  const userIds = matching.map((m) => m.userId);

  const existing = await db
    .select({ userId: schema.achievements.userId })
    .from(schema.achievements)
    .where(
      and(inArray(schema.achievements.userId, userIds), eq(schema.achievements.badgeCode, BADGES.profeta.code)),
    );
  const hasBadge = new Set(existing.map((r) => r.userId));

  const awards: { userId: string; badgeCode: string; unlockedAt: number; matchId: number | null }[] = [];
  const now = Math.floor(Date.now() / 1000);

  for (const uid of userIds) {
    if (!hasBadge.has(uid)) {
      awards.push({ userId: uid, badgeCode: BADGES.profeta.code, unlockedAt: now, matchId: null });
    }
  }

  for (const batch of chunk(awards, BATCH_CHUNK)) {
    await runBatch(
      batch.map((a) =>
        db.insert(schema.achievements).values({
          userId: a.userId,
          badgeCode: a.badgeCode,
          unlockedAt: a.unlockedAt,
          matchId: a.matchId,
        }).onConflictDoNothing(),
      ),
    );
  }

  if (awards.length > 0) {
    log.info("badges.evaluateProfeta", { awarded: awards.length });
  }

  return awards.length;
}

export async function evaluateLeaderBadge(): Promise<string | null> {
  const top = await db
    .select()
    .from(schema.rankingsSnapshot)
    .where(eq(schema.rankingsSnapshot.position, 1))
    .limit(1);

  if (top.length === 0) return null;
  const userId = top[0].userId;

  const existing = await db
    .select()
    .from(schema.achievements)
    .where(and(eq(schema.achievements.userId, userId), eq(schema.achievements.badgeCode, BADGES.lider.code)))
    .limit(1);

  if (existing.length > 0) return null;

  const now = Math.floor(Date.now() / 1000);
  await db.insert(schema.achievements).values({
    userId,
    badgeCode: BADGES.lider.code,
    unlockedAt: now,
    matchId: null,
  }).onConflictDoNothing();

  log.info("badges.evaluateLeaderBadge", { userId });
  return userId;
}

export async function evaluateConectorBadge(userId: string): Promise<boolean> {
  const ownedLeagues = await db
    .select({ id: schema.leagues.id })
    .from(schema.leagues)
    .where(eq(schema.leagues.ownerId, userId));

  if (ownedLeagues.length === 0) return false;

  const existing = await db
    .select()
    .from(schema.achievements)
    .where(and(eq(schema.achievements.userId, userId), eq(schema.achievements.badgeCode, BADGES.conector.code)))
    .limit(1);
  if (existing.length > 0) return false;

  for (const league of ownedLeagues) {
    const count = await db
      .select({ c: sql<number>`count(*)` })
      .from(schema.leagueMembers)
      .where(eq(schema.leagueMembers.leagueId, league.id))
      .then((r) => Number(r[0]?.c ?? 0));

    if (count >= 10) {
      const now = Math.floor(Date.now() / 1000);
      await db.insert(schema.achievements).values({
        userId,
        badgeCode: BADGES.conector.code,
        unlockedAt: now,
        matchId: null,
      }).onConflictDoNothing();

      log.info("badges.evaluateConectorBadge", { userId, leagueId: league.id, memberCount: count });
      return true;
    }
  }

  return false;
}

export async function evaluateMadrugador(matchId: number, userId: string): Promise<boolean> {
  const match = await db.select().from(schema.matches).where(eq(schema.matches.id, matchId)).limit(1).then((r) => r[0]);
  if (!match || match.stage !== "group" || match.round == null) return false;

  const round = match.round;
  const roundMatchIds = await db
    .select({ id: schema.matches.id })
    .from(schema.matches)
    .where(and(eq(schema.matches.stage, "group"), eq(schema.matches.round, round)));
  const ids = roundMatchIds.map((m) => m.id);
  if (ids.length === 0) return false;

  const firstPred = await db
    .select({ userId: schema.predictions.userId })
    .from(schema.predictions)
    .where(inArray(schema.predictions.matchId, ids))
    .orderBy(schema.predictions.createdAt)
    .limit(1);

  if (firstPred[0]?.userId === userId) {
    const existing = await db
      .select()
      .from(schema.achievements)
      .where(and(eq(schema.achievements.userId, userId), eq(schema.achievements.badgeCode, BADGES.madrugador.code)))
      .limit(1);
    if (existing.length > 0) return false;
    await db.insert(schema.achievements).values({
      userId,
      badgeCode: BADGES.madrugador.code,
      unlockedAt: Math.floor(Date.now() / 1000),
      matchId,
    }).onConflictDoNothing();
    return true;
  }
  return false;
}