import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { and, eq, gt, lt, isNull, sql, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { isCronAuthorized } from "@/lib/cron/auth";
import { sendEmail } from "@/lib/email/send";
import { loadBranding } from "@/lib/email/branding";
import { reminderEmail, type MatchSummary } from "@/lib/email/templates";
import { parsePrefs } from "@/lib/email/prefs";
import { log } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";

const REMINDER_WINDOW_SECONDS = 12 * 60 * 60;
const REMINDER_DEDUPE_HOURS = 12;

export async function POST(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = Math.floor(Date.now() / 1000);
  const windowEnd = now + REMINDER_WINDOW_SECONDS;
  const dedupeFrom = now - REMINDER_DEDUPE_HOURS * 60 * 60;

  const home = alias(schema.teams, "home");
  const away = alias(schema.teams, "away");
  const upcoming = await db
    .select({
      id: schema.matches.id,
      scheduledAt: schema.matches.scheduledAt,
      stage: schema.matches.stage,
      groupCode: schema.matches.groupCode,
      homeName: home.namePt,
      awayName: away.namePt,
    })
    .from(schema.matches)
    .leftJoin(home, eq(schema.matches.homeTeamId, home.id))
    .leftJoin(away, eq(schema.matches.awayTeamId, away.id))
    .where(
      and(
        eq(schema.matches.status, "scheduled"),
        gt(schema.matches.scheduledAt, now),
        lt(schema.matches.scheduledAt, windowEnd),
      ),
    );

  if (upcoming.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no upcoming matches" });
  }

  const matchIds = upcoming.map((m) => m.id);

  const users = await db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.role, "participant"), isNull(schema.users.deletedAt)));

  const recentDispatches = await db
    .select({ userId: schema.emailDispatches.userId })
    .from(schema.emailDispatches)
    .where(
      and(
        eq(schema.emailDispatches.template, "reminder"),
        gt(schema.emailDispatches.sentAt, dedupeFrom),
      ),
    );
  const recentSet = new Set(recentDispatches.map((r) => r.userId));

  const predictedCounts = await db
    .select({ userId: schema.predictions.userId, matchId: schema.predictions.matchId })
    .from(schema.predictions)
    .where(inArray(schema.predictions.matchId, matchIds));
  const userPredicted = new Map<string, Set<number>>();
  for (const p of predictedCounts) {
    if (!userPredicted.has(p.userId)) userPredicted.set(p.userId, new Set());
    userPredicted.get(p.userId)!.add(p.matchId);
  }

  const branding = await loadBranding();
  let sent = 0;

  for (const user of users) {
    if (recentSet.has(user.id)) continue;
    const prefs = parsePrefs(user.emailPrefsJson);
    if (!prefs.reminders) continue;

    const userPredictedSet = userPredicted.get(user.id) ?? new Set<number>();
    const pending: MatchSummary[] = upcoming
      .filter((m) => !userPredictedSet.has(m.id))
      .map((m) => ({
        homeName: m.homeName ?? "—",
        awayName: m.awayName ?? "—",
        scheduledAt: m.scheduledAt,
        stage: m.stage,
        group: m.groupCode,
      }));

    if (pending.length === 0) continue;

    const tpl = reminderEmail(branding, user.name ?? "colega", pending);
    await sendEmail({ to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text });
    await db.insert(schema.emailDispatches).values({
      userId: user.id,
      template: "reminder",
      contextJson: JSON.stringify({ pendingCount: pending.length }),
      sentAt: now,
      status: "sent",
    });
    sent++;
  }

  log.info("cron.reminders", { sent, candidates: users.length, upcoming: upcoming.length });
  return NextResponse.json({ sent, candidates: users.length, upcoming: upcoming.length });
}
