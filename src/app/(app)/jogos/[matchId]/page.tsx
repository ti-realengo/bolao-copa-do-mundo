import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { eq, asc, isNull, and } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommentsSection } from "./comments-section";
import { brDateFormat } from "@/lib/date";
import { stageLabel } from "@/lib/stages";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({ params }: { params: Promise<{ matchId: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const { matchId } = await params;
  const id = Number(matchId);
  if (!Number.isInteger(id)) notFound();

  const home = alias(schema.teams, "home");
  const away = alias(schema.teams, "away");
  const row = await db
    .select({ match: schema.matches, home, away })
    .from(schema.matches)
    .leftJoin(home, eq(schema.matches.homeTeamId, home.id))
    .leftJoin(away, eq(schema.matches.awayTeamId, away.id))
    .where(eq(schema.matches.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!row) notFound();

  const now = Math.floor(Date.now() / 1000);
  const kickedOff = now >= row.match.scheduledAt;

  const comments = kickedOff
    ? await db
        .select({ comment: schema.matchComments, user: schema.users })
        .from(schema.matchComments)
        .innerJoin(schema.users, eq(schema.users.id, schema.matchComments.userId))
        .where(and(eq(schema.matchComments.matchId, id), isNull(schema.matchComments.hiddenAt)))
        .orderBy(asc(schema.matchComments.createdAt))
    : [];

  const myComment = comments.find((c) => c.user.id === session.user.id) ?? null;

  const dateFmt = brDateFormat({
    weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="text-sm text-brand-text-muted">
            {stageLabel(row.match)}
            {" · "}
            {dateFmt.format(new Date(row.match.scheduledAt * 1000))}
          </div>
          <CardTitle className="text-2xl">
            {row.home?.namePt} × {row.away?.namePt}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {row.match.status === "finished" && row.match.homeScore != null ? (
            <div className="text-4xl font-display font-bold font-mono">
              {row.match.homeScore} – {row.match.awayScore}
            </div>
          ) : row.match.status === "live" ? (
            <div className="text-brand-primary font-semibold">AO VIVO {row.match.homeScore ?? 0}–{row.match.awayScore ?? 0}</div>
          ) : (
            <div className="text-brand-text-muted text-sm">Aguardando início</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comentários</CardTitle>
        </CardHeader>
        <CardContent>
          {!kickedOff ? (
            <p className="text-sm text-brand-text-muted">
              Comentários abrem quando o jogo começa.
            </p>
          ) : (
            <CommentsSection
              matchId={id}
              currentUserId={session.user.id}
              isSuperadmin={session.user.role === "superadmin"}
              myComment={myComment ? { id: myComment.comment.id, body: myComment.comment.body } : null}
              comments={comments.map((c) => ({
                id: c.comment.id,
                body: c.comment.body,
                createdAt: c.comment.createdAt,
                userId: c.user.id,
                userName: c.user.name ?? c.user.email.split("@")[0],
              }))}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
