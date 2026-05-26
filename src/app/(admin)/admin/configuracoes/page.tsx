import { db, schema } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsForm } from "./form";

export const dynamic = "force-dynamic";

const KEYS = ["company_name", "primary_color", "secondary_color", "accent_color", "logo_url", "rules_html"];

export default async function ConfiguracoesPage() {
  const rows = await db.select().from(schema.settings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const initial = Object.fromEntries(KEYS.map((k) => [k, map[k] ?? ""]));

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Configurações</h1>
      <Card>
        <CardContent className="py-6">
          <SettingsForm initial={initial as Record<string, string>} />
        </CardContent>
      </Card>
    </div>
  );
}
