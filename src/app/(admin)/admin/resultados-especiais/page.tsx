import { db, schema } from "@/lib/db";
import { asc, eq } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { SpecialResultsForm } from "./form";

export const dynamic = "force-dynamic";

export default async function ResultadosEspeciaisPage() {
  const teams = await db.select().from(schema.teams).orderBy(asc(schema.teams.namePt));
  const row = await db.select().from(schema.settings).where(eq(schema.settings.key, "special_results_json")).limit(1).then((r) => r[0]);
  const initial = row ? row.value : "{}";

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Resultados dos palpites especiais</h1>
      <p className="text-sm text-brand-text-muted">
        Defina aqui o vencedor real de cada categoria. Salvar dispara recálculo de pontuação.
      </p>
      <Card>
        <CardContent className="py-6">
          <SpecialResultsForm
            teams={teams.map((t) => ({ id: t.id, name: t.namePt }))}
            initialJson={initial}
          />
        </CardContent>
      </Card>
    </div>
  );
}
