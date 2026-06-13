import { db, runBatch, schema } from "@/lib/db";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { scorePrediction } from "./engine";
import { recomputeAllSpecials } from "./specials";
import { loadScoringConfig } from "./config";
import { evaluateBadgesAfterMatch } from "@/lib/badges/evaluate";

const BATCH_CHUNK = 50;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function computeMatchPoints(matchId: number): Promise<number> {
  const match = await db.select().from(schema.matches).where(eq(schema.matches.id, matchId)).limit(1).then((r) => r[0]);
  if (!match) throw new Error(`match ${matchId} not found`);
  if (match.status !== "finished" || match.homeScore == null || match.awayScore == null) {
    return 0;
  }

  const config = await loadScoringConfig();
  const preds = await db.select().from(schema.predictions).where(eq(schema.predictions.matchId, matchId));
  if (preds.length === 0) return 0;

  const matchInfo = {
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    stage: match.stage,
    homeTeamId: match.homeTeamId!,
    awayTeamId: match.awayTeamId!,
    winnerTeamId: match.winnerTeamId,
  };

  const updatedAt = Math.floor(Date.now() / 1000);
  const updates = preds.map((p) => {
    const r = scorePrediction(
      { homeScore: p.homeScore, awayScore: p.awayScore, advancingTeamId: p.advancingTeamId },
      matchInfo,
      { exact: config.exact, winnerOrDraw: config.winnerOrDraw, knockoutAdvancingBonus: config.knockoutAdvancingBonus },
    );
    return { id: p.id, points: r.points, isExact: r.isExact ? 1 : 0, isWinnerCorrect: r.isWinnerCorrect ? 1 : 0 };
  });

  for (const batch of chunk(updates, BATCH_CHUNK)) {
    await runBatch(
      batch.map((u) =>
        db
          .update(schema.predictions)
          .set({ points: u.points, isExact: u.isExact, isWinnerCorrect: u.isWinnerCorrect, updatedAt })
          .where(eq(schema.predictions.id, u.id)),
      ),
    );
  }

  await evaluateBadgesAfterMatch(matchId);
  return updates.length;
}

export async function refreshRankingsSnapshot(): Promise<number> {
  const specialsMap = await recomputeAllSpecials();
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

  const aggregatesByUser = new Map(aggregates.map((a) => [a.userId, a]));

  const allUsers = await db
    .select({ id: schema.users.id, createdAt: schema.users.createdAt })
    .from(schema.users)
    .where(and(eq(schema.users.role, "participant"), sql`${schema.users.deletedAt} is null`));

  const entries = allUsers.map((u) => {
    const a = aggregatesByUser.get(u.id);
    const special = specialsMap.get(u.id) ?? 0;
    const total = Number(a?.total ?? 0) + special;
    const exact = Number(a?.exact ?? 0);
    const winner = Number(a?.winner ?? 0);
    return {
      userId: u.id,
      totalPoints: total,
      exactCount: exact,
      winnerCount: winner,
      specialPoints: special,
      createdAt: u.createdAt,
    };
  });

  entries.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.exactCount !== a.exactCount) return b.exactCount - a.exactCount;
    if (b.winnerCount !== a.winnerCount) return b.winnerCount - a.winnerCount;
    if (b.specialPoints !== a.specialPoints) return b.specialPoints - a.specialPoints;
    return a.createdAt - b.createdAt;
  });

  const ranked = entries.map((e, idx) => ({
    ...e,
    position: idx + 1,
    positionChange: previousPositionByUser.has(e.userId)
      ? (previousPositionByUser.get(e.userId)! - (idx + 1))
      : null,
  }));

  await db.delete(schema.rankingsSnapshot);

  for (const batch of chunk(ranked, BATCH_CHUNK)) {
    await db.insert(schema.rankingsSnapshot).values(
      batch.map((e) => ({
        userId: e.userId,
        totalPoints: e.totalPoints,
        exactCount: e.exactCount,
        winnerCount: e.winnerCount,
        specialPoints: e.specialPoints,
        position: e.position,
        positionChange: e.positionChange,
        updatedAt: now,
      })),
    );
  }

  return entries.length;
}