import { db, schema } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ObservabilidadePage() {
  const [usersCount, predictionsCount, sessionsCount, finishedMatches] = await Promise.all([
    db.select({ c: sql<number>`count(*)` }).from(schema.users).then((r) => Number(r[0]?.c ?? 0)),
    db.select({ c: sql<number>`count(*)` }).from(schema.predictions).then((r) => Number(r[0]?.c ?? 0)),
    db.select({ c: sql<number>`count(*)` }).from(schema.sessions).then((r) => Number(r[0]?.c ?? 0)),
    db.select({ c: sql<number>`count(*)` }).from(schema.matches).where(eq(schema.matches.status, "finished")).then((r) => Number(r[0]?.c ?? 0)),
  ]);

  const lastDispatches = await db
    .select()
    .from(schema.emailDispatches)
    .orderBy(desc(schema.emailDispatches.id))
    .limit(20);

  const lastAudit = await db
    .select()
    .from(schema.auditLog)
    .orderBy(desc(schema.auditLog.createdAt))
    .limit(20);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Observabilidade</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Usuários" value={usersCount} />
        <Stat label="Sessões ativas" value={sessionsCount} />
        <Stat label="Palpites" value={predictionsCount} />
        <Stat label="Jogos finalizados" value={finishedMatches} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saúde</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <div><code>/api/health</code> retorna status da DB e versão.</div>
          <div className="text-brand-text-muted">
            Configure Workers Logpush apontando pro coletor de logs (Logtail, Datadog, etc) — todos os logs estruturados começam com <code>{`{"ts":"..."}`}</code>.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos disparos de email</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-brand-surface text-left">
              <tr>
                <th className="px-4 py-2">Quando</th>
                <th className="px-4 py-2">Template</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Contexto</th>
              </tr>
            </thead>
            <tbody>
              {lastDispatches.map((d) => (
                <tr key={d.id} className="border-t border-brand-border">
                  <td className="px-4 py-2 font-mono text-xs">
                    {d.sentAt ? new Date(d.sentAt * 1000).toLocaleString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-2">{d.template}</td>
                  <td className="px-4 py-2">{d.status}</td>
                  <td className="px-4 py-2 text-xs text-brand-text-muted">{d.contextJson ?? "—"}</td>
                </tr>
              ))}
              {lastDispatches.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-brand-text-muted">Nenhum email enviado ainda.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas ações sensíveis</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-brand-surface text-left">
              <tr>
                <th className="px-4 py-2">Quando</th>
                <th className="px-4 py-2">Ação</th>
                <th className="px-4 py-2">Alvo</th>
              </tr>
            </thead>
            <tbody>
              {lastAudit.map((a) => (
                <tr key={a.id} className="border-t border-brand-border">
                  <td className="px-4 py-2 font-mono text-xs">{new Date(a.createdAt * 1000).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-2 font-mono text-xs">{a.action}</td>
                  <td className="px-4 py-2">{a.target ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-brand-text-muted">{label}</CardTitle>
      </CardHeader>
      <CardContent className="text-3xl font-display font-bold font-mono">{value.toLocaleString("pt-BR")}</CardContent>
    </Card>
  );
}
