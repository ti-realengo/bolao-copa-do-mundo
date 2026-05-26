import { db, schema } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";

export interface Branding {
  appUrl: string;
  companyName: string;
  primaryColor: string;
}

export async function loadBranding(): Promise<Branding> {
  const rows = await db
    .select()
    .from(schema.settings)
    .where(inArray(schema.settings.key, ["company_name", "primary_color"]));
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    appUrl: process.env.APP_URL ?? "http://localhost:3000",
    companyName: map.company_name || "Empresa",
    primaryColor: map.primary_color ? `hsl(${map.primary_color})` : "#009C3B",
  };
}
