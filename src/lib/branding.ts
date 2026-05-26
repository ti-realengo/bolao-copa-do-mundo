import { cache } from "react";
import { inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export interface Branding {
  companyName: string | null;
  logoUrl: string | null;
}

const DEFAULTS: Branding = {
  companyName: null,
  logoUrl: null,
};

export const getBranding = cache(async (): Promise<Branding> => {
  if (process.env.NEXT_PHASE === "phase-production-build") return DEFAULTS;
  try {
    const rows = await db
      .select()
      .from(schema.settings)
      .where(inArray(schema.settings.key, ["company_name", "logo_url"]));
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      companyName: map.company_name?.trim() || null,
      logoUrl: map.logo_url?.trim() || null,
    };
  } catch {
    return DEFAULTS;
  }
});
