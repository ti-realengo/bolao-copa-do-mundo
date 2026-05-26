import { db, schema } from "@/lib/db";
import { sql, isNull, and, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BroadcastForm } from "./form";

export const dynamic = "force-dynamic";

export default async function BroadcastPage() {
  const total = await db
    .select({ c: sql<number>`count(*)` })
    .from(schema.users)
    .where(and(eq(schema.users.role, "participant"), isNull(schema.users.deletedAt)))
    .then((r) => Number(r[0]?.c ?? 0));

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Broadcast por email</h1>
      <p className="text-sm text-brand-text-muted">
        Envia para <strong>{total}</strong> participantes ativos. Quem desativou
        a opção <em>broadcast</em> nas preferências não recebe.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compor mensagem</CardTitle>
        </CardHeader>
        <CardContent>
          <BroadcastForm totalCount={total} />
        </CardContent>
      </Card>
    </div>
  );
}
