import { db, schema } from "@/lib/db";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { scorePrediction } from "./engine";
import { recomputeAllSpecials } from "./specials";
import { loadScoringConfig } from "./config";
import { evaluateBadgesAfterMatch } from "@/lib/badges/evaluate";

export async function computeMatchPoints(matchId: number): Promise<number> {
  const match = await db.select().from(schema.matches).where(eq(schema.matches.id, matchId)).limit(1).then((r) => r[0]);
  if (!match) throw new Error(`match ${matchId} not found`);
  if (match.status !== "finished" || match.homeScore == null || match.awayScore == null) {
    return 0;
  }

  const config = await loadScoringConfig();
  const preds = await db.select().from(schema.predictions).where(eq(schema.predictions.matchId, matchId));
  const matchInfo = {
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    stage: match.stage,
    homeTeamId: match.homeTeamId!,
    awayTeamId: match.awayTeamId!,
    winnerTeamId: match.winnerTeamId,
  };

  let updated = 0;
  for (const p of preds) {
    const r = scorePrediction(
      { homeScore: p.homeScore, awayScore: p.awayScore, advancingTeamId: p.advancingTeamId },
      matchInfo,
      { exact: config.exact, winnerOrDraw: config.winnerOrDraw, knockoutAdvancingBonus: config.knockoutAdvancingBonus },
    );
    await db.update(schema.predictions).set({
      points: r.points,
      isExact: r.isExact ? 1 : 0,
      isWinnerCorrect: r.isWinnerCorrect ? 1 : 0,
      updatedAt: Math.floor(Date.now() / 1000),
    }).where(eq(schema.predictions.id, p.id));
    updated++;
  }
  await evaluateBadgesAfterMatch(matchId);
  return updated;
}

export async function refreshRankingsSnapshot(): Promise<number> {
  await recomputeAllSpecials();
  const now = Math.floor(Date.now() / 1000);
  const previous = await db.select().from(schema.rankingsSnapshot);
  const previousPositionByUser = new Map(previous.map((r) => [r.userId, r.position]));

  const aggregates = await db
    .select({
      userId: schema.predictions.userId,
      total: sql<number>`coalesce(sum(${schema.predictions.points}), 0)`,
      exact: sql<number>`coalesce(sum(${schema.predictions.isExact}), 0)`,
      winner: sql<number>`coalesce(sum(${schema.predictions.isWinnerCorrect}), 0)`,
    })
    .from(schema.predictions)
    .where(isNotNull(schema.predictions.points))
    .groupBy(schema.predictions.userId);

  const specialPts = await db
    .select({ userId: schema.specialPredictions.userId, points: schema.specialPredictions.points })
    .from(schema.specialPredictions);
  const specialByUser = new Map(specialPts.map((r) => [r.userId, r.points ?? 0]));

  const allUsers = await db
    .select({ id: schema.users.id, createdAt: schema.users.createdAt })
    .from(schema.users)
    .where(and(eq(schema.users.role, "participant"), sql`${schema.users.deletedAt} is null`));

  const map = new Map<string, { total: number; exact: number; winner: number; special: number; createdAt: number }>();
  for (const u of allUsers) {
    map.set(u.id, { total: 0, exact: 0, winner: 0, special: specialByUser.get(u.id) ?? 0, createdAt: u.createdAt });
  }
  for (const a of aggregates) {
    const cur = map.get(a.userId);
    if (!cur) continue;
    cur.total = Number(a.total);
    cur.exact = Number(a.exact);
    cur.winner = Number(a.winner);
  }

  const entries = Array.from(map.entries()).map(([userId, v]) => ({
    userId,
    totalPoints: v.total + v.special,
    exactCount: v.exact,
    winnerCount: v.winner,
    specialPoints: v.special,
    createdAt: v.createdAt,
  }));

  entries.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.exactCount !== a.exactCount) return b.exactCount - a.exactCount;
    if (b.winnerCount !== a.winnerCount) return b.winnerCount - a.winnerCount;
    if (b.specialPoints !== a.specialPoints) return b.specialPoints - a.specialPoints;
    return a.createdAt - b.createdAt;
  });

  await db.delete(schema.rankingsSnapshot);
  let position = 0;
  for (const e of entries) {
    position++;
    const prev = previousPositionByUser.get(e.userId) ?? null;
    await db.insert(schema.rankingsSnapshot).values({
      userId: e.userId,
      totalPoints: e.totalPoints,
      exactCount: e.exactCount,
      winnerCount: e.winnerCount,
      specialPoints: e.specialPoints,
      position,
      positionChange: prev != null ? prev - position : null,
      updatedAt: now,
    });
  }
  return entries.length;
}
