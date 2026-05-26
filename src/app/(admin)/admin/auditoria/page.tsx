import { db, schema } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AuditoriaPage() {
  const rows = await db
    .select({
      log: schema.auditLog,
      userEmail: schema.users.email,
    })
    .from(schema.auditLog)
    .leftJoin(schema.users, eq(schema.users.id, schema.auditLog.userId))
    .orderBy(desc(schema.auditLog.createdAt))
    .limit(200);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Auditoria</h1>
      <p className="text-sm text-brand-text-muted">Últimas 200 ações sensíveis.</p>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-brand-surface text-left">
              <tr>
                <th className="px-4 py-2">Quando</th>
                <th className="px-4 py-2">Quem</th>
                <th className="px-4 py-2">Ação</th>
                <th className="px-4 py-2">Alvo</th>
                <th className="px-4 py-2">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.log.id} className="border-t border-brand-border align-top">
                  <td className="px-4 py-2 whitespace-nowrap font-mono text-xs">
                    {new Date(r.log.createdAt * 1000).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-2">{r.userEmail ?? r.log.userId ?? "—"}</td>
                  <td className="px-4 py-2 font-mono text-xs">{r.log.action}</td>
                  <td className="px-4 py-2">{r.log.target ?? "—"}</td>
                  <td className="px-4 py-2 text-xs text-brand-text-muted max-w-xs truncate" title={r.log.metadataJson ?? ""}>
                    {r.log.metadataJson ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
