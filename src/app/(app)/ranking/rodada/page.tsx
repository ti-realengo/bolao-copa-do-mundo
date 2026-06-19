import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const ROUNDS = [
  { value: "group-1", label: "Rodada 1", stage: "group", round: 1 },
  { value: "group-2", label: "Rodada 2", stage: "group", round: 2 },
  { value: "group-3", label: "Rodada 3", stage: "group", round: 3 },
  { value: "r16", label: "Oitavas de final", stage: "r16", round: null },
  { value: "qf", label: "Quartas de final", stage: "qf", round: null },
  { value: "sf", label: "Semifinais", stage: "sf", round: null },
  { value: "3rd", label: "3º lugar", stage: "3rd", round: null },
  { value: "final", label: "Final", stage: "final", round: null },
] as const;

type RoundValue = (typeof ROUNDS)[number]["value"];

interface PageProps {
  searchParams: Promise<{ rodada?: string }>;
}

export default async function RankingRodadaPage({ searchParams }: PageProps) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const selected: RoundValue = (params.rodada as RoundValue) ?? "group-1";
  const roundDef = ROUNDS.find((r) => r.value === selected) ?? ROUNDS[0];

  const matchFilter =
    roundDef.round !== null
      ? and(eq(schema.matches.stage, roundDef.stage), eq(schema.matches.round, roundDef.round))
      : eq(schema.matches.stage, roundDef.stage);

  const rows = await db
    .select({
      userId: schema.predictions.userId,
      userName: schema.users.name,
      userEmail: schema.users.email,
      points: sql<number>`coalesce(sum(${schema.predictions.points}), 0)`,
      exactCount: sql<number>`coalesce(sum(${schema.predictions.isExact}), 0)`,
      winnerCount: sql<number>`coalesce(sum(${schema.predictions.isWinnerCorrect}), 0)`,
    })
    .from(schema.predictions)
    .innerJoin(schema.matches, eq(schema.predictions.matchId, schema.matches.id))
    .innerJoin(schema.users, and(eq(schema.users.id, schema.predictions.userId), sql`${schema.users.deletedAt} is null`))
    .where(matchFilter)
    .groupBy(schema.predictions.userId, schema.users.name, schema.users.email)
    .orderBy(desc(sql`coalesce(sum(${schema.predictions.points}), 0)`), desc(sql`coalesce(sum(${schema.predictions.isExact}), 0)`), desc(sql`coalesce(sum(${schema.predictions.isWinnerCorrect}), 0)`), asc(schema.users.name));

  const ranked = rows.map((row, i) => ({
    ...row,
    position: i + 1,
  }));

  const me = ranked.find((r) => r.userId === session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Ranking por rodada</h1>
        <p className="text-brand-text-muted mt-1">Pontuação filtrada por fase da competição.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ROUNDS.map((r) => (
          <a
            key={r.value}
            href={`/ranking/rodada?rodada=${r.value}`}
            className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
              r.value === selected
                ? "border-brand-primary/40 bg-brand-primary/12 text-brand-primary"
                : "border-brand-border bg-brand-card text-brand-text-muted hover:border-brand-border-strong hover:text-brand-text"
            }`}
          >
            {r.label}
          </a>
        ))}
      </div>

      {ranked.length > 0 ? (
        <Card className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-brand-surface text-left">
              <tr>
                <th className="px-2 py-1.5 sm:px-4 sm:py-2 font-medium w-8">#</th>
                <th className="px-2 py-1.5 sm:px-4 sm:py-2 font-medium">Nome</th>
                <th className="px-2 py-1.5 sm:px-4 sm:py-2 font-medium text-right">Pts</th>
                <th className="px-2 py-1.5 sm:px-4 sm:py-2 font-medium text-right">
                  <span className="hidden sm:inline">Cravadas</span>
                  <span className="sm:hidden">Crav.</span>
                </th>
                <th className="px-2 py-1.5 sm:px-4 sm:py-2 font-medium text-right">
                  <span className="hidden sm:inline">Vencedor</span>
                  <span className="sm:hidden">Venc.</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((row) => {
                const isMe = row.userId === session.user.id;
                return (
                  <tr
                    key={row.userId}
                    className={`border-t border-brand-border ${isMe ? "bg-brand-primary/8" : ""}`}
                  >
                    <td className="px-2 py-1.5 sm:px-4 sm:py-2 font-mono">{row.position}</td>
                    <td className="px-2 py-1.5 sm:px-4 sm:py-2 max-w-[120px] sm:max-w-none truncate">
                      {row.userName ?? row.userEmail}
                    </td>
                    <td className="px-2 py-1.5 sm:px-4 sm:py-2 text-right font-mono font-semibold">
                      {row.points}
                    </td>
                    <td className="px-2 py-1.5 sm:px-4 sm:py-2 text-right font-mono">
                      {row.exactCount}
                    </td>
                    <td className="px-2 py-1.5 sm:px-4 sm:py-2 text-right font-mono">
                      {row.winnerCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="p-6 text-center text-brand-text-muted">
          Nenhum palpite pontuado nesta rodada ainda.
        </Card>
      )}

      {!me && ranked.length > 0 && (
        <Card className="p-4 text-sm text-brand-text-muted">
          Você ainda não pontuou nesta rodada.
        </Card>
      )}
    </div>
  );
}