import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, MinusCircle, Trophy, TrendingUp, Target } from "lucide-react";
import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { cn } from "@/lib/utils";
import { brDateKey, brDateFormat } from "@/lib/date";
import { KNOCKOUT_STAGES, stageLabel } from "@/lib/stages";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function HistoricoPage({ searchParams }: PageProps) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const filter = params.filter ?? "all";

  const home = alias(schema.teams, "home");
  const away = alias(schema.teams, "away");

  const finishedMatches = await db
    .select({
      match: schema.matches,
      home,
      away,
    })
    .from(schema.matches)
    .leftJoin(home, eq(schema.matches.homeTeamId, home.id))
    .leftJoin(away, eq(schema.matches.awayTeamId, away.id))
    .where(eq(schema.matches.status, "finished"))
    .orderBy(desc(schema.matches.scheduledAt));

  const userPredictions = await db
    .select()
    .from(schema.predictions)
    .where(eq(schema.predictions.userId, session.user.id));

  const predByMatch = new Map(userPredictions.map((p) => [p.matchId, p]));

  const advancingTeamIds = userPredictions
    .filter((p) => p.advancingTeamId != null)
    .map((p) => p.advancingTeamId!);
  const teamIds = new Set([...advancingTeamIds]);
  let advancingTeams: Map<number, typeof schema.teams.$inferSelect> = new Map();
  if (teamIds.size > 0) {
    const teams = await db
      .select()
      .from(schema.teams)
      .where(sql`${schema.teams.id} in (${Array.from(teamIds)})`);
    advancingTeams = new Map(teams.map((t) => [t.id, t]));
  }

  type Row = (typeof finishedMatches)[number] & { prediction: NonNullable<typeof userPredictions[number]> };

  const rowsWithPrediction: Row[] = finishedMatches
    .filter((r) => predByMatch.has(r.match.id) && predByMatch.get(r.match.id)!.points != null)
    .map((r) => ({ ...r, prediction: predByMatch.get(r.match.id)! }));

  let filtered = rowsWithPrediction;
  if (filter === "group") {
    filtered = filtered.filter((r) => r.match.stage === "group");
  } else if (filter === "knockout") {
    filtered = filtered.filter((r) => KNOCKOUT_STAGES.includes(r.match.stage));
  }

  const groupedByDay = new Map<string, Row[]>();
  for (const r of filtered) {
    const key = brDateKey(r.match.scheduledAt);
    if (!groupedByDay.has(key)) groupedByDay.set(key, []);
    groupedByDay.get(key)!.push(r);
  }

  const sortedDays = [...groupedByDay.entries()].sort(([a], [b]) => b.localeCompare(a));

  const totalPoints = rowsWithPrediction.reduce((sum, r) => sum + (r.prediction.points ?? 0), 0);
  const exactCount = rowsWithPrediction.filter((r) => r.prediction.isExact).length;
  const winnerCount = rowsWithPrediction.filter((r) => r.prediction.isWinnerCorrect && !r.prediction.isExact).length;
  const totalEvaluated = rowsWithPrediction.length;

  const dayFormatter = brDateFormat({
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const dateFmt = brDateFormat({
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6 min-w-0">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold">Histórico de Palpites</h1>
        <p className="text-brand-text-muted mt-1.5 text-sm md:text-base">
          Veja como você se saiu nos jogos já encerrados.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-brand-border bg-brand-card p-4 text-center">
          <div className="flex items-center justify-center mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary/15 text-brand-primary">
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="font-display font-bold text-2xl text-brand-text">{totalPoints.toLocaleString("pt-BR")}</p>
          <p className="text-xs text-brand-text-muted mt-0.5">pontos</p>
        </div>
        <div className="rounded-2xl border border-brand-border bg-brand-card p-4 text-center">
          <div className="flex items-center justify-center mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/15 text-green-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="font-display font-bold text-2xl text-brand-text">{exactCount}</p>
          <p className="text-xs text-brand-text-muted mt-0.5">cravadas</p>
        </div>
        <div className="rounded-2xl border border-brand-border bg-brand-card p-4 text-center">
          <div className="flex items-center justify-center mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-500/15 text-yellow-500">
              <Target className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="font-display font-bold text-2xl text-brand-text">{winnerCount}</p>
          <p className="text-xs text-brand-text-muted mt-0.5">vencedores</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { value: "all", label: "Todos" },
          { value: "group", label: "Fase de grupos" },
          { value: "knockout", label: "Mata-mata" },
        ].map((f) => {
          const active = filter === f.value;
          const href = f.value === "all" ? "/historico" : `/historico?filter=${f.value}`;
          return (
            <Link
              key={f.value}
              href={href}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-brand-primary text-white shadow-[0_4px_14px_-4px_hsl(var(--brand-primary)/0.55)]"
                  : "bg-brand-card border border-brand-border text-brand-text-muted hover:text-brand-text hover:border-brand-border-strong",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {sortedDays.length === 0 && (
        <div className="rounded-2xl border border-dashed border-brand-border bg-brand-card/50 p-8 text-center text-sm text-brand-text-muted">
          {totalEvaluated === 0
            ? "Nenhum palpite avaliado ainda. Jogos encerrados aparecerão aqui."
            : "Nenhum resultado encontrado com esse filtro."}
        </div>
      )}

      {sortedDays.map(([dayKey, dayRows]) => (
        <section key={dayKey} className="space-y-3">
          <h2 className="font-display text-lg font-semibold capitalize text-brand-text">
            {dayFormatter.format(new Date(dayKey + "T12:00:00Z"))}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {dayRows.map((r) => {
              const isExact = r.prediction.isExact;
              const isWinnerCorrect = r.prediction.isWinnerCorrect;
              const points = r.prediction.points ?? 0;
              const isKnockout = KNOCKOUT_STAGES.includes(r.match.stage);
              const matchHomeWon = r.match.homeScore != null && r.match.awayScore != null && r.match.homeScore > r.match.awayScore;
              const matchAwayWon = r.match.homeScore != null && r.match.awayScore != null && r.match.awayScore > r.match.homeScore;
              const matchDraw = r.match.homeScore != null && r.match.awayScore != null && r.match.homeScore === r.match.awayScore;

              let resultColor: string;
              let resultIcon: React.ReactNode;
              if (isExact) {
                resultColor = "text-green-500";
                resultIcon = <CheckCircle2 className="h-4 w-4" />;
              } else if (isWinnerCorrect) {
                resultColor = "text-yellow-500";
                resultIcon = <Target className="h-4 w-4" />;
              } else {
                resultColor = "text-brand-text-muted";
                resultIcon = <MinusCircle className="h-4 w-4" />;
              }

              return (
                <div
                  key={r.match.id}
                  className={cn(
                    "rounded-2xl border bg-brand-card p-4 sm:p-5 transition-all min-w-0 overflow-hidden",
                    isExact && "border-green-500/40",
                    isWinnerCorrect && !isExact && "border-yellow-500/40",
                    !isExact && !isWinnerCorrect && "border-brand-border",
                  )}
                >
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="text-brand-text-muted">{stageLabel(r.match)}</span>
                    <span className="font-mono font-medium text-brand-text">
                      {dateFmt.format(new Date(r.match.scheduledAt * 1000))}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-medium truncate text-sm">{r.home?.namePt ?? "—"}</span>
                        {r.home?.flagUrl && (
                          <Image
                            src={r.home.flagUrl}
                            alt=""
                            width={22}
                            height={15}
                            className="rounded-[2px] shrink-0"
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={cn(
                        "w-9 h-9 flex items-center justify-center font-display font-bold text-sm rounded-xl",
                        r.match.winnerTeamId === r.match.homeTeamId ? "bg-brand-primary/15 text-brand-primary" : "bg-brand-surface-2",
                      )}>
                        {r.match.homeScore ?? "-"}
                      </span>
                      <span className="text-brand-text-muted text-xs">x</span>
                      <span className={cn(
                        "w-9 h-9 flex items-center justify-center font-display font-bold text-sm rounded-xl",
                        r.match.winnerTeamId === r.match.awayTeamId ? "bg-brand-primary/15 text-brand-primary" : "bg-brand-surface-2",
                      )}>
                        {r.match.awayScore ?? "-"}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {r.away?.flagUrl && (
                          <Image
                            src={r.away.flagUrl}
                            alt=""
                            width={22}
                            height={15}
                            className="rounded-[2px] shrink-0"
                          />
                        )}
                        <span className="font-medium truncate text-sm">{r.away?.namePt ?? "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-brand-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-brand-text-muted">Seu palpite</span>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("font-mono font-semibold", isExact ? "text-green-500" : "text-brand-text")}>
                          {r.prediction.homeScore}
                        </span>
                        <span className="text-brand-text-muted">x</span>
                        <span className={cn("font-mono font-semibold", isExact ? "text-green-500" : "text-brand-text")}>
                          {r.prediction.awayScore}
                        </span>
                        {isKnockout && r.prediction.advancingTeamId != null && (
                          <span className="text-brand-text-muted">
                            &rarr; {advancingTeams.get(r.prediction.advancingTeamId)?.namePt ?? "?"}
                          </span>
                        )}
                      </div>
                    </div>
                    {isKnockout && r.match.winnerTeamId && (
                      <div className="mt-1 text-xs text-brand-primary font-medium text-center">
                        Classificou: {r.match.winnerTeamId === r.match.homeTeamId ? r.home?.namePt : r.away?.namePt}
                      </div>
                    )}
                  </div>

                  <div className={cn("mt-3 pt-3 border-t border-brand-border flex items-center justify-between")}>
                    <div className={cn("flex items-center gap-1.5 text-sm font-semibold", resultColor)}>
                      {resultIcon}
                      <span>
                        {isExact ? "Cravada!" : isWinnerCorrect ? "Vencedor certo" : "Errou"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-display font-bold text-lg text-brand-text">{points}</span>
                      <span className="text-xs text-brand-text-muted">pts</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {totalEvaluated > 0 && (
        <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Resumo geral</h3>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/12 text-brand-primary">
              <Trophy className="h-4 w-4" />
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-text-muted">Total de palpites avaliados</span>
              <span className="font-semibold">{totalEvaluated}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-text-muted">Pontuação total</span>
              <span className="font-semibold">{totalPoints.toLocaleString("pt-BR")} pts</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-500 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Cravadas
              </span>
              <span className="font-semibold">{exactCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-yellow-500 flex items-center gap-1">
                <Target className="h-3.5 w-3.5" /> Vencedor certo
              </span>
              <span className="font-semibold">{winnerCount}</span>
            </div>
          </div>

          <Link
            href="/ranking"
            className="mt-5 flex items-center justify-center gap-2 w-full rounded-xl border border-brand-border bg-brand-surface-2 hover:bg-brand-surface px-3 py-2.5 text-xs font-medium text-brand-text transition-colors"
          >
            Ver ranking completo
          </Link>
        </div>
      )}
    </div>
  );
}