"use server";

import { db, runBatch, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { eq, inArray, sql } from "drizzle-orm";
import { refreshRankingsSnapshot } from "@/lib/scoring/compute";
import { scorePrediction } from "@/lib/scoring/engine";
import { loadScoringConfig } from "@/lib/scoring/config";
import { syncWorldCupFromFootballData } from "@/lib/football-data/sync";
import { logAudit } from "@/lib/audit/log";

const BATCH_CHUNK = 50;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function requireSuperadmin() {
  const session = await getCurrentSession();
  if (!session || session.user.role !== "superadmin") throw new Error("forbidden");
  return session;
}

export async function syncMatches(): Promise<{ ok: boolean; message?: string; error?: string }> {
  const session = await requireSuperadmin();

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return { ok: false, error: "FOOTBALL_DATA_API_KEY ausente" };

  try {
    const result = await syncWorldCupFromFootballData(apiKey);
    await logAudit(session.user.id, "admin.matches.sync", null, { ...result });
    return {
      ok: true,
      message: `${result.matchesInserted} novos, ${result.matchesUpdated} atualizados, ${result.pointsRecomputed} pontuados`,
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function recomputeAll(): Promise<{ ok: boolean; message?: string }> {
  const session = await requireSuperadmin();

  // ── Load everything in 3 queries instead of 1000+ ──
  const finishedMatches = await db
    .select()
    .from(schema.matches)
    .where(sql`${schema.matches.status} = 'finished'`);

  if (finishedMatches.length === 0) {
    return { ok: true, message: "Nenhum jogo finalizado" };
  }

  const matchIds = finishedMatches.map((m) => m.id);
  const allPredictions = await db
    .select()
    .from(schema.predictions)
    .where(inArray(schema.predictions.matchId, matchIds));

  const config = await loadScoringConfig();
  const matchMap = new Map(finishedMatches.map((m) => [m.id, m]));

  // ── Score all predictions in memory ──
  const updatedAt = Math.floor(Date.now() / 1000);
  const updates = allPredictions
    .filter((p) => {
      const m = matchMap.get(p.matchId);
      return m && m.homeScore != null && m.awayScore != null;
    })
    .map((p) => {
      const m = matchMap.get(p.matchId)!;
      const r = scorePrediction(
        { homeScore: p.homeScore, awayScore: p.awayScore, advancingTeamId: p.advancingTeamId },
        {
          homeScore: m.homeScore!,
          awayScore: m.awayScore!,
          stage: m.stage,
          homeTeamId: m.homeTeamId!,
          awayTeamId: m.awayTeamId!,
          winnerTeamId: m.winnerTeamId,
        },
        {
          exact: config.exact,
          winnerOrDraw: config.winnerOrDraw,
          knockoutAdvancingBonus: config.knockoutAdvancingBonus,
        },
      );
      return {
        id: p.id,
        points: r.points,
        isExact: r.isExact ? 1 : 0,
        isWinnerCorrect: r.isWinnerCorrect ? 1 : 0,
      };
    });

  // ── Batch update all predictions ──
  for (const batch of chunk(updates, BATCH_CHUNK)) {
    await runBatch(
      batch.map((u) =>
        db
          .update(schema.predictions)
          .set({
            points: u.points,
            isExact: u.isExact,
            isWinnerCorrect: u.isWinnerCorrect,
            updatedAt,
          })
          .where(eq(schema.predictions.id, u.id)),
      ),
    );
  }

  // ── Refresh rankings snapshot (upsert, not delete+insert) ──
  const usersScored = await refreshRankingsSnapshot({ recomputeSpecials: true });

  await logAudit(session.user.id, "admin.matches.recompute", null, {
    finished: finishedMatches.length,
    predictionsScored: updates.length,
    usersScored,
  });

  return {
    ok: true,
    message: `${finishedMatches.length} jogos, ${updates.length} palpites, ${usersScored} usuários no ranking`,
  };
}