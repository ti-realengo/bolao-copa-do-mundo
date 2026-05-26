import { db, schema } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { desc } from "drizzle-orm";
import { ResetPasswordButton } from "./reset-password-button";

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  const users = await db.select().from(schema.users).orderBy(desc(schema.users.createdAt)).limit(200);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Usuários ({users.length})</h1>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-surface text-left">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Papel</th>
              <th className="px-4 py-2">Cadastro</th>
              <th className="px-4 py-2">Último login</th>
              <th className="px-4 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-brand-border">
                <td className="px-4 py-2">{u.name ?? "—"}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">
                  <span className="inline-flex items-center gap-1.5">
                    {u.role}
                    {u.passwordMustChange ? (
                      <span className="inline-flex rounded-full bg-brand-warning/15 text-brand-warning px-2 py-0.5 text-xs">
                        senha resetada
                      </span>
                    ) : null}
                  </span>
                </td>
                <td className="px-4 py-2">{new Date(u.createdAt * 1000).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-2">
                  {u.lastLoginAt ? new Date(u.lastLoginAt * 1000).toLocaleString("pt-BR") : "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  {u.deletedAt ? (
                    <span className="text-xs text-brand-text-muted">conta excluída</span>
                  ) : (
                    <ResetPasswordButton userId={u.id} userEmail={u.email} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
