import { db, schema } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { SyncButton, RecomputeButton } from "./buttons";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminJogosPage() {
  const total = await db.select({ c: sql<number>`count(*)` }).from(schema.matches).then((r) => Number(r[0]?.c ?? 0));
  const finished = await db.select({ c: sql<number>`count(*)` }).from(schema.matches).where(sql`${schema.matches.status} = 'finished'`).then((r) => Number(r[0]?.c ?? 0));

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Jogos & resultados</h1>

      <Card>
        <CardContent className="py-6 space-y-4">
          <div className="text-sm">
            <strong>{total}</strong> jogos cadastrados — <strong>{finished}</strong> finalizados.
          </div>
          <div className="flex gap-3">
            <SyncButton />
            <RecomputeButton />
          </div>
          <p className="text-xs text-brand-text-muted">
            Sync busca dados em tempo real na Football-Data.org. Recálculo refaz pontuação de todos os jogos finalizados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
