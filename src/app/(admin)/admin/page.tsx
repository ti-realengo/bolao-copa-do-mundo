import { db, schema } from "@/lib/db";
import { asc, desc, eq, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const usersCount = await db.select({ c: sql<number>`count(*)` }).from(schema.users).then((r) => r[0]?.c ?? 0);
  const matchesCount = await db.select({ c: sql<number>`count(*)` }).from(schema.matches).then((r) => r[0]?.c ?? 0);
  const predictionsCount = await db.select({ c: sql<number>`count(*)` }).from(schema.predictions).then((r) => r[0]?.c ?? 0);
  const finishedCount = await db.select({ c: sql<number>`count(*)` }).from(schema.matches).where(sql`${schema.matches.status} = 'finished'`).then((r) => r[0]?.c ?? 0);

  const ranking = await db
    .select({ r: schema.rankingsSnapshot, user: schema.users })
    .from(schema.rankingsSnapshot)
    .innerJoin(schema.users, eq(schema.users.id, schema.rankingsSnapshot.userId))
    .orderBy(asc(schema.rankingsSnapshot.position))
    .limit(20);

  const fallbackRanking = ranking.length === 0
    ? await db
        .select({
          userId: schema.predictions.userId,
          name: schema.users.name,
          email: schema.users.email,
          predictions: sql<number>`count(*)`.as("predictions"),
        })
        .from(schema.predictions)
        .innerJoin(schema.users, eq(schema.users.id, schema.predictions.userId))
        .groupBy(schema.predictions.userId)
        .orderBy(desc(sql`count(*)`))
        .limit(20)
    : [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat title="Usuários" value={Number(usersCount)} />
        <Stat title="Jogos cadastrados" value={Number(matchesCount)} />
        <Stat title="Jogos finalizados" value={Number(finishedCount)} />
        <Stat title="Palpites totais" value={Number(predictionsCount)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ranking de participantes</CardTitle>
          <p className="text-sm text-brand-text-muted">
            {ranking.length > 0
              ? "Top 20 do ranking oficial — atualizado após cada jogo finalizado."
              : "Ainda não há jogos finalizados. Mostrando participação por número de palpites."}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {ranking.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-brand-surface text-left text-brand-text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">#</th>
                  <th className="px-4 py-2 font-medium">Nome</th>
                  <th className="px-4 py-2 font-medium text-right">Pts</th>
                  <th className="px-4 py-2 font-medium text-right">Cravadas</th>
                  <th className="px-4 py-2 font-medium text-right">Vencedor</th>
                  <th className="px-4 py-2 font-medium text-right">Especiais</th>
                  <th className="px-4 py-2 font-medium text-right">Δ</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((row) => (
                  <tr key={row.user.id} className="border-t border-brand-border">
                    <td className="px-4 py-2 font-mono">{row.r.position ?? "–"}</td>
                    <td className="px-4 py-2">{row.user.name ?? row.user.email}</td>
                    <td className="px-4 py-2 text-right font-mono font-semibold">{row.r.totalPoints}</td>
                    <td className="px-4 py-2 text-right font-mono">{row.r.exactCount}</td>
                    <td className="px-4 py-2 text-right font-mono">{row.r.winnerCount}</td>
                    <td className="px-4 py-2 text-right font-mono">{row.r.specialPoints}</td>
                    <td className="px-4 py-2 text-right">
                      {row.r.positionChange == null
                        ? "–"
                        : row.r.positionChange > 0
                          ? `↑${row.r.positionChange}`
                          : row.r.positionChange < 0
                            ? `↓${-row.r.positionChange}`
                            : "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : fallbackRanking.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-brand-surface text-left text-brand-text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">#</th>
                  <th className="px-4 py-2 font-medium">Nome</th>
                  <th className="px-4 py-2 font-medium text-right">Palpites</th>
                </tr>
              </thead>
              <tbody>
                {fallbackRanking.map((row, i) => (
                  <tr key={row.userId} className="border-t border-brand-border">
                    <td className="px-4 py-2 font-mono">{i + 1}</td>
                    <td className="px-4 py-2">{row.name ?? row.email}</td>
                    <td className="px-4 py-2 text-right font-mono">{Number(row.predictions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-brand-text-muted">
              Nenhum participante votou ainda.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-brand-text-muted">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-3xl font-display font-bold font-mono">{value.toLocaleString("pt-BR")}</CardContent>
    </Card>
  );
}
