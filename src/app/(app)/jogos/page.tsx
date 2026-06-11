import Link from "next/link";
import Image from "next/image";
import { LayoutGrid, List, TrendingUp, ArrowRight } from "lucide-react";
import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { and, asc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { MatchCard } from "./match-card";
import { GroupSelect } from "./group-select";
import { cn } from "@/lib/utils";
import { brDateKey, brDateFormat } from "@/lib/date";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ filter?: string; group?: string; view?: string }>;
}

const FILTERS = [
  { value: "all", label: "Todos os jogos" },
  { value: "group", label: "Fase de Grupos" },
  { value: "knockout", label: "Mata-mata" },
  { value: "mine", label: "Meus jogos" },
];

const KNOCKOUT_STAGES = ["last_16", "quarter", "semi", "third", "final"];

export default async function JogosPage({ searchParams }: PageProps) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const filter = params.filter ?? "all";
  const group = params.group ?? "all";
  const view = params.view === "list" ? "list" : "grid";

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
            {FILTERS.map((f) => {
              const active = filter === f.value;
              const href = (() => {
                const sp = new URLSearchParams();
                if (f.value !== "all") sp.set("filter", f.value);
                if (group !== "all") sp.set("group", group);
                if (view !== "grid") sp.set("view", view);
                return `/jogos${sp.toString() ? `?${sp.toString()}` : ""}`;
              })();
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

          <div className="flex items-center gap-2">
            <GroupSelect groupCodes={groupCodes} current={group} filter={filter} view={view} />
            <ViewToggle view={view} filter={filter} group={group} />
          </div>
        </div>

        {/* Days */}
        {Array.from(groupedByDay.entries()).map(([day, dayMatches]) => (
          <section key={day} className="space-y-3">
            <h2 className="font-display text-lg font-semibold capitalize text-brand-text">
              {dayFormatter.format(new Date(day + "T12:00:00Z"))}
            </h2>
            <div
              className={cn(
                "grid gap-3",
                view === "grid" ? "md:grid-cols-2" : "grid-cols-1",
              )}
            >
              {dayMatches.map((r) => (
                <MatchCard
                  key={r.match.id}
                  match={r.match}
                  home={r.home}
                  away={r.away}
                  prediction={predByMatch.get(r.match.id) ?? null}
                />
              ))}
            </div>
          </section>
        ))}

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

function ViewToggle({ view, filter, group }: { view: string; filter: string; group: string }) {
  const sp = new URLSearchParams();
  if (filter !== "all") sp.set("filter", filter);
  if (group !== "all") sp.set("group", group);
  const gridHref = `/jogos${sp.toString() ? `?${sp.toString()}` : ""}`;
  sp.set("view", "list");
  const listHref = `/jogos?${sp.toString()}`;
  return (
    <div className="inline-flex rounded-xl border border-brand-border bg-brand-card p-1">
      <Link
        href={gridHref}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          view === "grid"
            ? "bg-brand-surface-2 text-brand-text"
            : "text-brand-text-muted hover:text-brand-text",
        )}
        aria-label="Grid"
      >
        <LayoutGrid className="h-4 w-4" />
      </Link>
      <Link
        href={listHref}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          view === "list"
            ? "bg-brand-surface-2 text-brand-text"
            : "text-brand-text-muted hover:text-brand-text",
        )}
        aria-label="Lista"
      >
        <List className="h-4 w-4" />
      </Link>
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
