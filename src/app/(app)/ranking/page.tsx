import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { and, asc, eq, sql } from "drizzle-orm";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const rows = await db
    .select({
      r: schema.rankingsSnapshot,
      user: schema.users,
    })
    .from(schema.rankingsSnapshot)
    .innerJoin(schema.users, and(eq(schema.users.id, schema.rankingsSnapshot.userId), sql`${schema.users.deletedAt} is null`))
    .orderBy(asc(schema.rankingsSnapshot.position))
    .limit(100);

  const me = rows.find((r) => r.user.id === session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Ranking geral</h1>
        <p className="text-brand-text-muted mt-1">Top 100. Atualizado após cada jogo.</p>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-surface text-left">
            <tr>
              <th className="px-4 py-2 font-medium">#</th>
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium text-right">Pts</th>
              <th className="px-4 py-2 font-medium text-right">Cravadas</th>
              <th className="px-4 py-2 font-medium text-right">Δ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isMe = row.user.id === session.user.id;
              return (
                <tr key={row.user.id} className={`border-t border-brand-border ${isMe ? "bg-brand-secondary/10" : ""}`}>
                  <td className="px-4 py-2 font-mono">{row.r.position}</td>
                  <td className="px-4 py-2">{row.user.name ?? row.user.email}</td>
                  <td className="px-4 py-2 text-right font-mono font-semibold">{row.r.totalPoints}</td>
                  <td className="px-4 py-2 text-right font-mono">{row.r.exactCount}</td>
                  <td className="px-4 py-2 text-right">
                    {row.r.positionChange == null ? "–" : row.r.positionChange > 0 ? `↑${row.r.positionChange}` : row.r.positionChange < 0 ? `↓${-row.r.positionChange}` : "–"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {!me && rows.length > 0 && (
        <Card className="p-4 text-sm text-brand-text-muted">
          Você ainda não pontuou. Faça seus palpites!
        </Card>
      )}

      {rows.length === 0 && (
        <Card className="p-6 text-center text-brand-text-muted">
          Ranking aparece aqui depois do primeiro jogo terminar.
        </Card>
      )}
    </div>
  );
}
