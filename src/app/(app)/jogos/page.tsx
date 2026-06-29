import Link from "next/link";
import Image from "next/image";
import { TrendingUp, ArrowRight, ChevronDown } from "lucide-react";
import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { MatchCard } from "./match-card";
import { GroupSelect } from "./group-select";
import { FilterSelect } from "./filter-select";
import { cn } from "@/lib/utils";
import { brDateKey, brDateFormat } from "@/lib/date";
import { KNOCKOUT_STAGES } from "@/lib/stages";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ filter?: string; group?: string }>;
}

export default async function JogosPage({ searchParams }: PageProps) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const filter = params.filter ?? "all";
  const group = params.group ?? "all";

  const home = alias(schema.teams, "home");
  const away = alias(schema.teams, "away");

  const rows = await db
    .select({
      match: schema.matches,
      home,
      away,
    })
    .from(schema.matches)
    .leftJoin(home, eq(schema.matches.homeTeamId, home.id))
    .leftJoin(away, eq(schema.matches.awayTeamId, away.id))
    .orderBy(asc(schema.matches.scheduledAt));

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
      .where(inArray(schema.teams.id, Array.from(teamIds)));
    advancingTeams = new Map(teams.map((t) => [t.id, t]));
  }

  // Apply filters
  let filtered = rows;
  if (filter === "group") {
    filtered = filtered.filter((r) => r.match.stage === "group");
  } else if (filter === "knockout") {
    filtered = filtered.filter((r) => KNOCKOUT_STAGES.includes(r.match.stage));
  } else if (filter === "mine") {
    filtered = filtered.filter((r) => predByMatch.has(r.match.id));
  }
  if (group !== "all") {
    filtered = filtered.filter((r) => r.match.groupCode === group);
  }

  const groupedByDay = new Map<string, typeof rows>();
  for (const r of filtered) {
    const key = brDateKey(r.match.scheduledAt);
    if (!groupedByDay.has(key)) groupedByDay.set(key, []);
    groupedByDay.get(key)!.push(r);
  }

  // Partition into today, future, past
  const todayKey = brDateKey(Math.floor(Date.now() / 1000));
  const allEntries = [...groupedByDay.entries()];
  const todayEntries = allEntries.filter(([k]) => k === todayKey);
  const futureEntries = allEntries.filter(([k]) => k > todayKey).sort(([a], [b]) => a.localeCompare(b));
  const pastEntries = allEntries.filter(([k]) => k < todayKey).sort(([a], [b]) => b.localeCompare(a));

  const pastMatchCount = pastEntries.reduce((sum, [, ms]) => sum + ms.length, 0);

  const dayFormatter = brDateFormat({
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const groupCodes = Array.from(
    new Set(rows.map((r) => r.match.groupCode).filter(Boolean) as string[]),
  ).sort();

  // Right widget data: Seu desempenho
  const ranking = await db
    .select()
    .from(schema.rankingsSnapshot)
    .where(eq(schema.rankingsSnapshot.userId, session.user.id))
    .limit(1)
    .then((r) => r[0]);

  const totalParticipants = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.users)
    .where(and(eq(schema.users.role, "participant"), sql`${schema.users.deletedAt} is null`))
    .then((r) => Number(r[0]?.count ?? 0));

  const correctPredictions = userPredictions.filter(
    (p) => p.points !== null && p.points !== undefined && p.points > 0,
  ).length;
  const evaluatedPredictions = userPredictions.filter(
    (p) => p.points !== null && p.points !== undefined,
  ).length;
  const accuracy =
    evaluatedPredictions > 0 ? Math.round((correctPredictions / evaluatedPredictions) * 100) : null;

  // Próximos jogos que você palpita
  const now = Math.floor(Date.now() / 1000);
  const nextWithPredictions = userPredictions
    .map((p) => {
      const matchRow = rows.find((r) => r.match.id === p.matchId);
      return matchRow && matchRow.match.scheduledAt > now ? matchRow : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => a.match.scheduledAt - b.match.scheduledAt)
    .slice(0, 3);

  function renderDaySection(
    dayKey: string,
    dayMatches: typeof rows,
    dayLabel?: string,
  ) {
    return (
      <section key={dayKey} className="space-y-3">
        <h2 className="font-display text-lg font-semibold capitalize text-brand-text">
          {dayLabel ?? dayFormatter.format(new Date(dayKey + "T12:00:00Z"))}
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {dayMatches.map((r) => (
            <MatchCard
              key={r.match.id}
              match={r.match}
              home={r.home}
              away={r.away}
              prediction={predByMatch.get(r.match.id) ?? null}
              advancingTeam={(() => {
                const p = predByMatch.get(r.match.id);
                if (p?.advancingTeamId != null) return advancingTeams.get(p.advancingTeamId) ?? null;
                return null;
              })()}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="grid xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
      <div className="space-y-6 min-w-0">
        <header>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Jogos da Copa</h1>
          <p className="text-brand-text-muted mt-1.5 text-sm md:text-base">
            Acompanhe todos os jogos da Copa do Mundo 2026 e faça seus palpites.
          </p>
        </header>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect current={filter} group={group} />
            <GroupSelect groupCodes={groupCodes} current={group} filter={filter} disabled={filter === "knockout"} />
          </div>
        </div>

        {/* Histórico — past games with result cards */}
        {pastEntries.length > 0 && (
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer rounded-xl border border-brand-border bg-brand-card px-4 py-3 text-sm font-medium text-brand-text-muted hover:text-brand-text hover:border-brand-border-strong transition-colors list-none [&::-webkit-details-marker]:hidden">
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 shrink-0" />
              Histórico ({pastMatchCount} {pastMatchCount === 1 ? "jogo" : "jogos"})
            </summary>
            <div className="mt-4 space-y-6">
              {pastEntries.map(([dayKey, dayMatches]) => renderDaySection(dayKey, dayMatches))}
            </div>
          </details>
        )}

        {/* Today */}
        {todayEntries.map(([k, ms]) => renderDaySection(k, ms, `Hoje — ${dayFormatter.format(new Date(k + "T12:00:00Z"))}`))}

        {/* Future */}
        {futureEntries.map(([k, ms]) => renderDaySection(k, ms))}

        {filtered.length === 0 && rows.length > 0 && (
          <div className="rounded-2xl border border-dashed border-brand-border bg-brand-card/50 p-8 text-center text-sm text-brand-text-muted">
            Nenhum jogo encontrado com esse filtro.
          </div>
        )}

        {rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-brand-border bg-brand-card/50 p-8 text-center text-sm text-brand-text-muted">
            Nenhum jogo cadastrado ainda. O sync automático com a Football-Data roda a cada 5 minutos.
            {session.user.role === "superadmin" && (
              <>
                {" "}
                Pra forçar agora, vá em <Link href="/admin/jogos" className="text-brand-primary hover:underline">Gerenciar jogos</Link> e clique em <strong>Sync</strong>.
              </>
            )}
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <aside className="space-y-4">
        <PerformanceWidget
          position={ranking?.position ?? null}
          totalParticipants={totalParticipants}
          totalPoints={ranking?.totalPoints ?? 0}
          accuracy={accuracy}
        />
        <UpcomingPredictionsWidget rows={nextWithPredictions} />
      </aside>
    </div>
  );
}

function PerformanceWidget({
  position,
  totalParticipants,
  totalPoints,
  accuracy,
}: {
  position: number | null;
  totalParticipants: number;
  totalPoints: number;
  accuracy: number | null;
}) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-sm">Seu desempenho</h3>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/12 text-brand-primary">
          <TrendingUp className="h-4 w-4" />
        </span>
      </div>

      <div className="space-y-4">
        <Stat
          label="Posição geral"
          value={position ? `${position}º` : "—"}
          sub={position ? `de ${totalParticipants} participantes` : "Aguardando jogos"}
        />
        <Stat
          label="Pontuação"
          value={totalPoints.toLocaleString("pt-BR")}
          sub="pontos"
        />
        <Stat
          label="Acertos"
          value={accuracy !== null ? `${accuracy}%` : "—"}
          sub={accuracy !== null ? "de aproveitamento" : "Aguardando jogos"}
        />
      </div>

      <Link
        href="/ranking"
        className="mt-5 flex items-center justify-center gap-2 w-full rounded-xl border border-brand-border bg-brand-surface-2 hover:bg-brand-surface px-3 py-2.5 text-xs font-medium text-brand-text transition-colors"
      >
        Ver ranking completo
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <p className="text-xs text-brand-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className="font-display font-bold text-2xl leading-tight text-brand-text">{value}</p>
      <p className="text-xs text-brand-text-muted">{sub}</p>
    </div>
  );
}

function UpcomingPredictionsWidget({
  rows,
}: {
  rows: { match: typeof schema.matches.$inferSelect; home: typeof schema.teams.$inferSelect | null; away: typeof schema.teams.$inferSelect | null }[];
}) {
  const dateFmt = brDateFormat({
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
      <h3 className="font-semibold text-sm mb-4">Próximos jogos que você palpita</h3>

      {rows.length === 0 ? (
        <p className="text-xs text-brand-text-muted py-4 text-center">
          Você ainda não palpitou em nenhum jogo futuro.
        </p>
      ) : (
        <ul className="space-y-3.5">
          {rows.map((r) => (
            <li key={r.match.id}>
              <Link
                href={`/jogos/${r.match.id}`}
                className="block rounded-xl border border-brand-border/60 bg-brand-surface-2 hover:border-brand-primary/40 transition-colors p-3"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {r.home?.flagUrl && (
                      <Image
                        src={r.home.flagUrl}
                        alt=""
                        width={18}
                        height={12}
                        className="rounded-[2px] shrink-0"
                      />
                    )}
                    <span className="font-medium truncate">{r.home?.namePt ?? "—"}</span>
                  </div>
                  <span className="text-brand-text-muted shrink-0">×</span>
                  <div className="flex items-center gap-1.5 min-w-0 justify-end">
                    <span className="font-medium truncate text-right">{r.away?.namePt ?? "—"}</span>
                    {r.away?.flagUrl && (
                      <Image
                        src={r.away.flagUrl}
                        alt=""
                        width={18}
                        height={12}
                        className="rounded-[2px] shrink-0"
                      />
                    )}
                  </div>
                </div>
                <p className="font-mono text-[11px] text-brand-text-muted mt-1.5 text-center">
                  {dateFmt.format(new Date(r.match.scheduledAt * 1000))}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/jogos?filter=mine"
        className="mt-5 flex items-center justify-center gap-2 w-full rounded-xl border border-brand-border bg-brand-surface-2 hover:bg-brand-surface px-3 py-2.5 text-xs font-medium text-brand-text transition-colors"
      >
        Ver todos meus jogos
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}