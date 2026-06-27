import Link from "next/link";
import Image from "next/image";
import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BADGES } from "@/lib/badges/catalog";
import { getMessages, t as tFn } from "@/lib/i18n";
import { brDateFormat } from "@/lib/date";
import { stageLabel } from "@/lib/stages";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const m = await getMessages();
  const t = m.home;

  const now = Math.floor(Date.now() / 1000);
  const home = alias(schema.teams, "home");
  const away = alias(schema.teams, "away");

  const nextMatch = await db
    .select({ match: schema.matches, home, away })
    .from(schema.matches)
    .leftJoin(home, eq(schema.matches.homeTeamId, home.id))
    .leftJoin(away, eq(schema.matches.awayTeamId, away.id))
    .where(and(gt(schema.matches.scheduledAt, now), eq(schema.matches.status, "scheduled")))
    .orderBy(asc(schema.matches.scheduledAt))
    .limit(1)
    .then((r) => r[0]);

  const myPredOnNext = nextMatch
    ? await db
        .select()
        .from(schema.predictions)
        .where(and(eq(schema.predictions.userId, session.user.id), eq(schema.predictions.matchId, nextMatch.match.id)))
        .limit(1)
        .then((r) => r[0])
    : null;

  const snap = await db
    .select()
    .from(schema.rankingsSnapshot)
    .where(eq(schema.rankingsSnapshot.userId, session.user.id))
    .limit(1)
    .then((r) => r[0]);

  const top5 = await db
    .select({ user: schema.users, r: schema.rankingsSnapshot })
    .from(schema.rankingsSnapshot)
    .innerJoin(schema.users, and(eq(schema.users.id, schema.rankingsSnapshot.userId), sql`${schema.users.deletedAt} is null`))
    .orderBy(asc(schema.rankingsSnapshot.position))
    .limit(5);

  const userBadges = await db
    .select()
    .from(schema.achievements)
    .where(eq(schema.achievements.userId, session.user.id))
    .orderBy(desc(schema.achievements.unlockedAt));

  const myLeagues = await db
    .select({ league: schema.leagues })
    .from(schema.leagueMembers)
    .innerJoin(schema.leagues, eq(schema.leagues.id, schema.leagueMembers.leagueId))
    .where(eq(schema.leagueMembers.userId, session.user.id))
    .limit(3);

  const totalPredictions = await db
    .select({ c: sql<number>`count(*)` })
    .from(schema.predictions)
    .where(eq(schema.predictions.userId, session.user.id))
    .then((r) => Number(r[0]?.c ?? 0));

  const dateFmt = brDateFormat({
    weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t.greeting}, {session.user.name?.split(" ")[0] ?? ""}</h1>
        <p className="text-brand-text-muted mt-1">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-brand-text-muted">
              {t.nextMatch}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextMatch ? (
              <Link href={`/jogos/${nextMatch.match.id}`} className="block">
                <div className="flex items-center justify-between gap-4">
                  <TeamSide name={nextMatch.home?.namePt ?? "—"} flag={nextMatch.home?.flagUrl ?? null} align="left" />
                  <div className="text-center shrink-0">
                    <div className="text-xs text-brand-text-muted uppercase">
                      {stageLabel(nextMatch.match)}
                    </div>
                    <div className="font-mono text-2xl font-bold mt-1">VS</div>
                    <div className="text-xs text-brand-text-muted mt-1">
                      {dateFmt.format(new Date(nextMatch.match.scheduledAt * 1000))}
                    </div>
                  </div>
                  <TeamSide name={nextMatch.away?.namePt ?? "—"} flag={nextMatch.away?.flagUrl ?? null} align="right" />
                </div>
                <div className="mt-4 text-center text-sm">
                  {myPredOnNext ? (
                    <span className="text-brand-primary">
                      ✓ {t.yourPrediction}: {myPredOnNext.homeScore}–{myPredOnNext.awayScore}
                    </span>
                  ) : (
                    <span className="text-brand-text-muted">{t.notPredictedYet}</span>
                  )}
                </div>
              </Link>
            ) : (
              <p className="text-brand-text-muted text-sm">{t.noNextMatch}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-brand-text-muted">
              {t.yourPosition}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-5xl font-display font-bold font-mono">
                {snap?.position ? `${snap.position}º` : "—"}
              </div>
              <div className="text-sm text-brand-text-muted">
                {snap?.totalPoints ?? 0} {t.points.toLowerCase()} · {snap?.exactCount ?? 0} {t.exact.toLowerCase()}
              </div>
            </div>
            <Link href="/ranking" className="text-sm text-brand-accent hover:underline">
              {t.seeRanking}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-brand-text-muted">
              {t.achievements}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.values(BADGES).map((b) => {
                const owned = userBadges.some((u) => u.badgeCode === b.code);
                return (
                  <div
                    key={b.code}
                    className={`text-2xl ${owned ? "" : "opacity-20 grayscale"}`}
                    title={`${b.name} — ${b.description}`}
                  >
                    {b.emoji}
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-brand-text-muted mt-3">
              {tFn(t.badgesUnlocked, { owned: userBadges.length, total: Object.keys(BADGES).length })}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-brand-text-muted">
              {t.topFive}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {top5.length === 0 ? (
              <p className="text-sm text-brand-text-muted px-6 pb-6">
                {t.rankingEmpty}
              </p>
            ) : (
              <ul className="divide-y divide-brand-border">
                {top5.map((row, i) => {
                  const isMe = row.user.id === session.user.id;
                  return (
                    <li
                      key={row.user.id}
                      className={`flex items-center justify-between px-6 py-2.5 text-sm ${isMe ? "bg-brand-secondary/10" : ""}`}
                    >
                      <span>
                        <span className="font-mono text-brand-primary font-bold mr-2">{i + 1}º</span>
                        {row.user.name ?? row.user.email.split("@")[0]}
                        {isMe && <span className="text-brand-text-muted ml-1">(você)</span>}
                      </span>
                      <span className="font-mono font-semibold">{row.r.totalPoints}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-brand-text-muted">
              {t.yourLeagues}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myLeagues.length === 0 ? (
              <p className="text-sm text-brand-text-muted">
                <Link href="/grupos" className="text-brand-accent hover:underline">{t.noLeagues}</Link>
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {myLeagues.map((l) => (
                  <li key={l.league.id}>
                    <Link href={`/grupos/${l.league.id}`} className="hover:text-brand-primary">
                      → {l.league.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-brand-text-muted">
              {t.activity}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-6 text-center">
            <Stat label={t.predictions} value={totalPredictions} />
            <Stat label={t.points} value={snap?.totalPoints ?? 0} />
            <Stat label={t.exact} value={snap?.exactCount ?? 0} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TeamSide({ name, flag, align }: { name: string; flag: string | null; align: "left" | "right" }) {
  const dir = align === "right" ? "flex-row-reverse" : "flex-row";
  return (
    <div className={`flex items-center gap-2 flex-1 min-w-0 ${dir}`}>
      {flag && <Image src={flag} alt="" width={36} height={26} className="rounded-sm shrink-0" />}
      <span className="font-display font-semibold truncate">{name}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-3xl md:text-4xl font-display font-bold font-mono">{value}</div>
      <div className="text-xs text-brand-text-muted uppercase mt-1">{label}</div>
    </div>
  );
}
