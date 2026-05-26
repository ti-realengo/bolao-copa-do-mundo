import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { and, eq, gte, lte, isNull, asc, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { isCronAuthorized } from "@/lib/cron/auth";
import { sendEmail } from "@/lib/email/send";
import { loadBranding } from "@/lib/email/branding";
import { recapEmail, type DayResult, type TopUser } from "@/lib/email/templates";
import { parsePrefs } from "@/lib/email/prefs";
import { log } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";

function startOfTodayUTC(): { from: number; to: number } {
  const now = new Date();
  const utcStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return { from: Math.floor(utcStart / 1000), to: Math.floor(utcStart / 1000) + 86400 };
}

export async function POST(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { from, to } = startOfTodayUTC();
  const home = alias(schema.teams, "home");
  const away = alias(schema.teams, "away");

  const todaysMatches = await db
    .select({
      id: schema.matches.id,
      homeName: home.namePt,
      awayName: away.namePt,
      homeScore: schema.matches.homeScore,
      awayScore: schema.matches.awayScore,
      status: schema.matches.status,
    })
    .from(schema.matches)
    .leftJoin(home, eq(schema.matches.homeTeamId, home.id))
    .leftJoin(away, eq(schema.matches.awayTeamId, away.id))
    .where(and(gte(schema.matches.scheduledAt, from), lte(schema.matches.scheduledAt, to)))
    .orderBy(asc(schema.matches.scheduledAt));

  const finished = todaysMatches.filter((m) => m.status === "finished" && m.homeScore != null && m.awayScore != null);
  if (finished.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no finished matches today" });
  }

  const todayMatchIds = finished.map((m) => m.id);
  const dayPoints = await db
    .select({
      userId: schema.predictions.userId,
      total: sql<number>`coalesce(sum(${schema.predictions.points}), 0)`,
    })
    .from(schema.predictions)
    .where(inArray(schema.predictions.matchId, todayMatchIds))
    .groupBy(schema.predictions.userId);

  const topByUser = new Map(dayPoints.map((d) => [d.userId, Number(d.total)]));
  const userIds = Array.from(topByUser.keys());

  const userRows = userIds.length === 0 ? [] : await db
    .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
    .from(schema.users)
    .where(inArray(schema.users.id, userIds));

  const top: TopUser[] = userRows
    .map((u) => ({ name: u.name ?? u.email.split("@")[0], points: topByUser.get(u.id) ?? 0 }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  const results: DayResult[] = finished.map((m) => ({
    homeName: m.homeName ?? "—",
    awayName: m.awayName ?? "—",
    homeScore: m.homeScore!,
    awayScore: m.awayScore!,
  }));

  const allUsers = await db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.role, "participant"), isNull(schema.users.deletedAt)));

  const dedupeFrom = Math.floor(Date.now() / 1000) - 20 * 60 * 60;
  const recentDispatches = await db
    .select({ userId: schema.emailDispatches.userId })
    .from(schema.emailDispatches)
    .where(and(
      eq(schema.emailDispatches.template, "recap"),
      gte(schema.emailDispatches.sentAt, dedupeFrom),
    ));
  const recentSet = new Set(recentDispatches.map((r) => r.userId));

  const branding = await loadBranding();
  const now = Math.floor(Date.now() / 1000);
  let sent = 0;

  for (const user of allUsers) {
    if (recentSet.has(user.id)) continue;
    const prefs = parsePrefs(user.emailPrefsJson);
    if (!prefs.recap) continue;

    const tpl = recapEmail(branding, user.name ?? "colega", results, top);
    await sendEmail({ to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text });
    await db.insert(schema.emailDispatches).values({
      userId: user.id,
      template: "recap",
      contextJson: JSON.stringify({ matches: finished.length }),
      sentAt: now,
      status: "sent",
    });
    sent++;
  }

  log.info("cron.recap", { sent, candidates: allUsers.length, finished: finished.length });
  return NextResponse.json({ sent, candidates: allUsers.length, finished: finished.length });
}
