"use server";

import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { sql } from "drizzle-orm";
import { computeMatchPoints, refreshRankingsSnapshot } from "@/lib/scoring/compute";
import { syncWorldCupFromFootballData } from "@/lib/football-data/sync";
import { logAudit } from "@/lib/audit/log";

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
  const finishedMatches = await db.select({ id: schema.matches.id }).from(schema.matches).where(sql`${schema.matches.status} = 'finished'`);
  for (const m of finishedMatches) {
    await computeMatchPoints(m.id);
  }
  const usersScored = await refreshRankingsSnapshot({ recomputeSpecials: true });
  await logAudit(session.user.id, "admin.matches.recompute", null, { finished: finishedMatches.length, usersScored });
  return { ok: true, message: `${finishedMatches.length} jogos, ${usersScored} usuários no ranking` };
}
