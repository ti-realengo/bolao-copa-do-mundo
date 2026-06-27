import Image from "next/image";
import Link from "next/link";
import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function RankingEspeciaisPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const champion = alias(schema.teams, "champion");
  const runnerup = alias(schema.teams, "runnerup");
  const third = alias(schema.teams, "third");
  const firstElim = alias(schema.teams, "first_elim");
  const surprise = alias(schema.teams, "surprise");

  const rows = await db
    .select({
      userId: schema.specialPredictions.userId,
      userName: schema.users.name,
      userEmail: schema.users.email,
      createdAt: schema.users.createdAt,
      points: schema.specialPredictions.points,
      championTeamId: schema.specialPredictions.championTeamId,
      runnerupTeamId: schema.specialPredictions.runnerupTeamId,
      thirdTeamId: schema.specialPredictions.thirdTeamId,
      topScorerName: schema.specialPredictions.topScorerName,
      firstEliminatedTeamId: schema.specialPredictions.firstEliminatedTeamId,
      surpriseTeamId: schema.specialPredictions.surpriseTeamId,
      championName: champion.namePt,
      championFlag: champion.flagUrl,
      runnerupName: runnerup.namePt,
      runnerupFlag: runnerup.flagUrl,
      thirdName: third.namePt,
      thirdFlag: third.flagUrl,
      firstElimName: firstElim.namePt,
      firstElimFlag: firstElim.flagUrl,
      surpriseName: surprise.namePt,
      surpriseFlag: surprise.flagUrl,
    })
    .from(schema.specialPredictions)
    .innerJoin(schema.users, and(eq(schema.users.id, schema.specialPredictions.userId), sql`${schema.users.deletedAt} is null`))
    .leftJoin(champion, eq(schema.specialPredictions.championTeamId, champion.id))
    .leftJoin(runnerup, eq(schema.specialPredictions.runnerupTeamId, runnerup.id))
    .leftJoin(third, eq(schema.specialPredictions.thirdTeamId, third.id))
    .leftJoin(firstElim, eq(schema.specialPredictions.firstEliminatedTeamId, firstElim.id))
    .leftJoin(surprise, eq(schema.specialPredictions.surpriseTeamId, surprise.id))
    .orderBy(desc(schema.specialPredictions.points), asc(schema.users.createdAt));

  const ranked = rows.map((row, i) => ({
    ...row,
    position: i + 1,
  }));

  const me = ranked.find((r) => r.userId === session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Palpites Especiais</h1>
        <p className="text-brand-text-muted mt-1">
          Quem palpitou o quê nos palpites especiais da Copa.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/ranking/rodada"
          className="rounded-xl border border-brand-border bg-brand-card px-4 py-1.5 text-sm font-medium text-brand-text-muted hover:border-brand-border-strong hover:text-brand-text transition-colors"
        >
          ← Voltar para Ranking por Rodada
        </Link>
        <Link
          href="/ranking"
          className="rounded-xl border border-brand-border bg-brand-card px-4 py-1.5 text-sm font-medium text-brand-text-muted hover:border-brand-border-strong hover:text-brand-text transition-colors"
        >
          Ranking Geral
        </Link>
      </div>

      {ranked.length > 0 ? (
        <Card className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-brand-surface text-left">
              <tr>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2 font-medium w-8">#</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2 font-medium sticky left-0 bg-brand-surface">Nome</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2 font-medium">
                  <span className="hidden sm:inline">Campeão</span>
                  <span className="sm:hidden">Camp.</span>
                </th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2 font-medium">
                  <span className="hidden sm:inline">Vice</span>
                  <span className="sm:hidden">Vice</span>
                </th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2 font-medium">
                  <span className="hidden sm:inline">3º</span>
                  <span className="sm:hidden">3º</span>
                </th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2 font-medium">
                  <span className="hidden sm:inline">Artilheiro</span>
                  <span className="sm:hidden">Artil.</span>
                </th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2 font-medium">
                  <span className="hidden sm:inline">1ª Eliminada</span>
                  <span className="sm:hidden">Elim.</span>
                </th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2 font-medium">
                  <span className="hidden sm:inline">Surpresa</span>
                  <span className="sm:hidden">Sorp.</span>
                </th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2 font-medium text-right">Pts</th>
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
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2 font-mono">{row.position}</td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2 max-w-[100px] sm:max-w-[160px] truncate font-medium sticky left-0 bg-inherit">
                      {row.userName ?? row.userEmail}
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                      <TeamCell name={row.championName} flag={row.championFlag} />
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                      <TeamCell name={row.runnerupName} flag={row.runnerupFlag} />
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                      <TeamCell name={row.thirdName} flag={row.thirdFlag} />
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2 max-w-[100px] truncate">
                      {row.topScorerName ?? "—"}
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                      <TeamCell name={row.firstElimName} flag={row.firstElimFlag} />
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                      <TeamCell name={row.surpriseName} flag={row.surpriseFlag} />
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-right font-mono font-semibold">
                      {row.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="p-6 text-center text-brand-text-muted">
          Ninguém registrou palpites especiais ainda.
        </Card>
      )}

      {!me && ranked.length > 0 && (
        <Card className="p-4 text-sm text-brand-text-muted">
          Você ainda não registrou seus palpites especiais.{" "}
          <Link href="/palpites-especiais" className="text-brand-primary hover:underline">
            Fazer palpites
          </Link>
        </Card>
      )}

      {ranked.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-3">Pontuação dos Especiais</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-brand-text-muted">
            <div>Campeão · 15 pts</div>
            <div>Vice · 10 pts</div>
            <div>3º lugar · 5 pts</div>
            <div>Artilheiro · 7 pts</div>
            <div>1ª eliminada · 3 pts</div>
            <div>Surpresa · 3 pts</div>
          </div>
        </Card>
      )}
    </div>
  );
}

function TeamCell({ name, flag }: { name: string | null; flag: string | null }) {
  if (!name) return <span className="text-brand-text-muted">—</span>;
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      {flag && (
        <Image
          src={flag}
          alt=""
          width={16}
          height={11}
          className="rounded-[2px] shrink-0"
        />
      )}
      <span className="truncate text-xs sm:text-sm">{name}</span>
    </div>
  );
}
