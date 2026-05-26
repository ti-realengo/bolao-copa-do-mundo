import { db, schema } from "@/lib/db";
import { and, eq, sql } from "drizzle-orm";
import { BADGES } from "./catalog";

async function alreadyHas(userId: string, badgeCode: string): Promise<boolean> {
  const r = await db
    .select()
    .from(schema.achievements)
    .where(and(eq(schema.achievements.userId, userId), eq(schema.achievements.badgeCode, badgeCode)))
    .limit(1);
  return r.length > 0;
}

async function award(userId: string, badgeCode: string, matchId?: number) {
  if (await alreadyHas(userId, badgeCode)) return false;
  await db.insert(schema.achievements).values({
    userId,
    badgeCode,
    unlockedAt: Math.floor(Date.now() / 1000),
    matchId: matchId ?? null,
  }).onConflictDoNothing();
  return true;
}

export async function evaluateBadgesAfterMatch(matchId: number): Promise<number> {
  const match = await db.select().from(schema.matches).where(eq(schema.matches.id, matchId)).limit(1).then((r) => r[0]);
  if (!match || match.status !== "finished") return 0;

  const home = match.homeTeamId ? await db.select().from(schema.teams).where(eq(schema.teams.id, match.homeTeamId)).limit(1).then((r) => r[0]) : null;
  const away = match.awayTeamId ? await db.select().from(schema.teams).where(eq(schema.teams.id, match.awayTeamId)).limit(1).then((r) => r[0]) : null;
  const isBrazil = home?.code === "BRA" || away?.code === "BRA";

  const preds = await db.select().from(schema.predictions).where(eq(schema.predictions.matchId, matchId));
  let awarded = 0;

  for (const p of preds) {
    if (!p.isExact) continue;
    const exactCount = await db
      .select({ c: sql<number>`count(*)` })
      .from(schema.predictions)
      .where(and(eq(schema.predictions.userId, p.userId), eq(schema.predictions.isExact, 1)))
      .then((r) => Number(r[0]?.c ?? 0));
    if (exactCount >= 5 && (await award(p.userId, BADGES.tarologo.code, matchId))) awarded++;
    if (isBrazil && (await award(p.userId, BADGES.cravou.code, matchId))) awarded++;
  }

  if (match.round != null && match.stage === "group") {
    const round = match.round;
    const roundMatchIds = await db
      .select({ id: schema.matches.id })
      .from(schema.matches)
      .where(and(eq(schema.matches.stage, "group"), eq(schema.matches.round, round), eq(schema.matches.status, "finished")));
    const totalInRound = await db
      .select({ c: sql<number>`count(*)` })
      .from(schema.matches)
      .where(and(eq(schema.matches.stage, "group"), eq(schema.matches.round, round)))
      .then((r) => Number(r[0]?.c ?? 0));

    if (totalInRound > 0 && roundMatchIds.length === totalInRound) {
      const ids = roundMatchIds.map((m) => m.id);
      const stats = await db
        .select({
          userId: schema.predictions.userId,
          total: sql<number>`count(*)`,
          zeros: sql<number>`sum(case when coalesce(${schema.predictions.points}, 0) = 0 then 1 else 0 end)`,
        })
        .from(schema.predictions)
        .where(sql`${schema.predictions.matchId} in (${sql.raw(ids.join(","))})`)
        .groupBy(schema.predictions.userId);

      for (const s of stats) {
        if (Number(s.total) >= 3 && Number(s.total) === Number(s.zeros)) {
          if (await award(s.userId, BADGES.zica.code)) awarded++;
        }
      }
    }
  }

  return awarded;
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
    .where(sql`${schema.predictions.matchId} in (${sql.raw(ids.join(","))})`)
    .orderBy(schema.predictions.createdAt)
    .limit(1);

  if (firstPred[0]?.userId === userId) {
    return await award(userId, BADGES.madrugador.code, matchId);
  }
  return false;
}
