import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { PrizesEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function AdminPremiosPage() {
  const row = await db.select().from(schema.settings).where(eq(schema.settings.key, "prizes_json")).limit(1).then((r) => r[0]);
  const initial = row?.value ?? "[]";
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Prêmios</h1>
      <Card>
        <CardContent className="py-6">
          <PrizesEditor initial={initial} />
        </CardContent>
      </Card>
    </div>
  );
}
