import { db, runBatch, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { DEFAULT_SCORING, loadScoringConfig, type ScoringConfig } from "./config";
import { log } from "@/lib/observability/logger";
import { evaluateProfeta } from "@/lib/badges/evaluate";

const BATCH_CHUNK = 50;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export interface SpecialResults {
  championTeamId: number | null;
  runnerupTeamId: number | null;
  thirdTeamId: number | null;
  topScorerName: string | null;
  firstEliminatedTeamId: number | null;
  surpriseTeamId: number | null;
}

export async function getSpecialResults(): Promise<SpecialResults> {
  const rows = await db.select().from(schema.settings).where(eq(schema.settings.key, "special_results_json")).limit(1);
  const row = rows[0];
  if (!row) return blank();
  try {
    return JSON.parse(row.value) as SpecialResults;
  } catch {
    return blank();
  }
}

function blank(): SpecialResults {
  return {
    championTeamId: null,
    runnerupTeamId: null,
    thirdTeamId: null,
    topScorerName: null,
    firstEliminatedTeamId: null,
    surpriseTeamId: null,
  };
}

function normalize(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().trim().normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

export function computeSpecialsForUser(
  pred: typeof schema.specialPredictions.$inferSelect,
  results: SpecialResults,
  weights: ScoringConfig["specials"] = DEFAULT_SCORING.specials,
): number {
  let pts = 0;
  if (pred.championTeamId && results.championTeamId === pred.championTeamId) pts += weights.champion;
  if (pred.runnerupTeamId && results.runnerupTeamId === pred.runnerupTeamId) pts += weights.runnerup;
  if (pred.thirdTeamId && results.thirdTeamId === pred.thirdTeamId) pts += weights.third;
  if (pred.firstEliminatedTeamId && results.firstEliminatedTeamId === pred.firstEliminatedTeamId) pts += weights.firstEliminated;
  if (pred.surpriseTeamId && results.surpriseTeamId === pred.surpriseTeamId) pts += weights.surprise;

  if (pred.topScorerName && results.topScorerName) {
    const a = normalize(pred.topScorerName);
    const b = normalize(results.topScorerName);
    if (a && b && (a === b || a.includes(b) || b.includes(a))) {
      pts += weights.topScorer;
    }
  }
  return pts;
}

// Reads the already-persisted special points (specialPredictions.points)
// without recomputing. Used by refreshRankingsSnapshot on the hot path
// (match-finish sync) where special results haven't changed — avoids the
// O(N) UPDATE over every special prediction on every cron run.
export async function getStoredSpecialPoints(): Promise<Map<string, number>> {
  const rows = await db
    .select({ userId: schema.specialPredictions.userId, points: schema.specialPredictions.points })
    .from(schema.specialPredictions);
  return new Map(rows.map((r) => [r.userId, r.points ?? 0]));
}

export async function recomputeAllSpecials(): Promise<Map<string, number>> {
  log.info("scoring.recomputeAllSpecials.start");
  const results = await getSpecialResults();
  const config = await loadScoringConfig();
  const all = await db.select().from(schema.specialPredictions);

  const computed: Map<string, number> = new Map();
  for (const p of all) {
    const pts = computeSpecialsForUser(p, results, config.specials);
    computed.set(p.userId, pts);
  }

  for (const batch of chunk(all, BATCH_CHUNK)) {
    await runBatch(
      batch.map((p) => {
        const pts = computed.get(p.userId)!;
        return db.update(schema.specialPredictions).set({ points: pts }).where(eq(schema.specialPredictions.userId, p.userId));
      }),
    );
  }

  log.info("scoring.recomputeAllSpecials.done", { userCount: all.length });

  await evaluateProfeta();

  return computed;
}