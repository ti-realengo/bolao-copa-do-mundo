import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { and, asc, eq, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeaveButton } from "./leave-button";
import { getAppUrl } from "@/lib/app-url";

export const dynamic = "force-dynamic";

export default async function LeaguePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const league = await db.select().from(schema.leagues).where(eq(schema.leagues.id, id)).limit(1).then((r) => r[0]);
  if (!league) notFound();

  const isMember = await db
    .select()
    .from(schema.leagueMembers)
    .where(and(eq(schema.leagueMembers.leagueId, id), eq(schema.leagueMembers.userId, session.user.id)))
    .limit(1)
    .then((r) => r.length > 0);
  if (!isMember) redirect("/grupos");

  const ranking = await db
    .select({
      user: schema.users,
      points: sql<number>`coalesce(${schema.rankingsSnapshot.totalPoints}, 0)`,
      exact: sql<number>`coalesce(${schema.rankingsSnapshot.exactCount}, 0)`,
      winner: sql<number>`coalesce(${schema.rankingsSnapshot.winnerCount}, 0)`,
      special: sql<number>`coalesce(${schema.rankingsSnapshot.specialPoints}, 0)`,
    })
    .from(schema.leagueMembers)
    .innerJoin(schema.users, and(eq(schema.users.id, schema.leagueMembers.userId), sql`${schema.users.deletedAt} is null`))
    .leftJoin(schema.rankingsSnapshot, eq(schema.rankingsSnapshot.userId, schema.users.id))
    .where(eq(schema.leagueMembers.leagueId, id))
    .orderBy(asc(schema.leagueMembers.joinedAt));

  ranking.sort((a, b) =>
    Number(b.points) - Number(a.points) ||
    Number(b.exact) - Number(a.exact) ||
    Number(b.winner) - Number(a.winner) ||
    Number(b.special) - Number(a.special) ||
    (a.user.createdAt ?? 0) - (b.user.createdAt ?? 0)
  );

  const isOwner = league.ownerId === session.user.id;
  const baseUrl = await getAppUrl();
  const inviteUrl = `${baseUrl}/grupos/entrar?code=${league.inviteCode}`;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-bold">{league.name}</h1>
        {league.description && <p className="text-brand-text-muted mt-1">{league.description}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Convide colegas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="font-mono text-sm bg-brand-surface rounded-lg p-3 break-all">
            {league.inviteCode}
          </div>
          <p className="text-xs text-brand-text-muted break-all">Link: {inviteUrl}</p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Ranking interno ({ranking.length} membros)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-brand-surface text-left">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2 text-right">Pts</th>
                <th className="px-4 py-2 text-right">Cravadas</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((row, i) => {
                const isMe = row.user.id === session.user.id;
                return (
                  <tr key={row.user.id} className={`border-t border-brand-border ${isMe ? "bg-brand-secondary/10" : ""}`}>
                    <td className="px-4 py-2 font-mono">{i + 1}</td>
                    <td className="px-4 py-2">{row.user.name ?? row.user.email}{isMe && " (você)"}</td>
                    <td className="px-4 py-2 text-right font-mono font-semibold">{Number(row.points)}</td>
                    <td className="px-4 py-2 text-right font-mono">{Number(row.exact)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {!isOwner && <LeaveButton leagueId={league.id} />}
        {isOwner && (
          <p className="text-sm text-brand-text-muted">
            Você é o dono. (Funcionalidades de gerenciamento serão adicionadas em breve.)
          </p>
        )}
      </div>
    </div>
  );
}
