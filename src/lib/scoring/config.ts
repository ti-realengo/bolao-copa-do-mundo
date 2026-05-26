import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { parseScoringConfig, type ScoringConfig } from "./config-types";

export { DEFAULT_SCORING, parseScoringConfig, type ScoringConfig } from "./config-types";

const SETTINGS_KEY = "scoring_json";

export async function loadScoringConfig(): Promise<ScoringConfig> {
  const row = await db.select().from(schema.settings).where(eq(schema.settings.key, SETTINGS_KEY)).limit(1).then((r) => r[0]);
  return parseScoringConfig(row?.value);
}

export async function saveScoringConfig(config: ScoringConfig): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const value = JSON.stringify(config);
  await db.insert(schema.settings).values({ key: SETTINGS_KEY, value, updatedAt: now }).onConflictDoUpdate({
    target: schema.settings.key,
    set: { value, updatedAt: now },
  });
}
