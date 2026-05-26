import Image from "next/image";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

interface Prize {
  position: number;
  title: string;
  description?: string;
  link?: string;
  imageUrl?: string;
}

async function loadPrizes(): Promise<Prize[]> {
  const row = await db.select().from(schema.settings).where(eq(schema.settings.key, "prizes_json")).limit(1).then((r) => r[0]);
  if (!row) return [];
  try {
    return JSON.parse(row.value) as Prize[];
  } catch {
    return [];
  }
}

export default async function PremiosPage() {
  const prizes = await loadPrizes();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-bold">Prêmios</h1>
      {prizes.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-brand-text-muted">
            O administrador ainda não configurou os prêmios.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {prizes.map((p) => (
            <Card key={p.position}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="font-display text-3xl font-bold w-12 shrink-0 text-brand-primary">{p.position}º</div>
                {p.imageUrl && (
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-brand-border bg-brand-surface">
                    <Image
                      src={p.imageUrl}
                      alt={p.title}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold">{p.title}</div>
                  {p.description && <div className="text-sm text-brand-text-muted">{p.description}</div>}
                  {p.link && (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-sm text-brand-accent hover:underline"
                    >
                      Ver prêmio →
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
