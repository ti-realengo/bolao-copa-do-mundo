import { db, schema } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { DomainsManager } from "./manager";

export const dynamic = "force-dynamic";

export default async function DominiosPage() {
  const domains = await db.select().from(schema.allowedDomains);
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Domínios permitidos</h1>
      <Card>
        <CardContent className="py-6">
          <DomainsManager initial={domains} />
        </CardContent>
      </Card>
    </div>
  );
}
