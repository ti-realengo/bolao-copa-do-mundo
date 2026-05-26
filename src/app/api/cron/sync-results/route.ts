import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron/auth";
import { syncWorldCupFromFootballData } from "@/lib/football-data/sync";
import { log } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "FOOTBALL_DATA_API_KEY missing" }, { status: 500 });

  const startedAt = Date.now();
  try {
    const result = await syncWorldCupFromFootballData(apiKey);
    log.info("cron.sync-results", { ...result, latencyMs: Date.now() - startedAt });
    return NextResponse.json({
      updated: result.matchesUpdated,
      inserted: result.matchesInserted,
      scored: result.pointsRecomputed,
    });
  } catch (e) {
    log.error("cron.sync-results failed", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
