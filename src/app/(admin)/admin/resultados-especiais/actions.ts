"use server";

import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { refreshRankingsSnapshot } from "@/lib/scoring/compute";
import { logAudit } from "@/lib/audit/log";
import { z } from "zod";

const Schema = z.object({
  championTeamId: z.number().int().positive().nullable(),
  runnerupTeamId: z.number().int().positive().nullable(),
  thirdTeamId: z.number().int().positive().nullable(),
  topScorerName: z.string().max(80).nullable().transform((v) => v?.trim() || null),
  firstEliminatedTeamId: z.number().int().positive().nullable(),
  surpriseTeamId: z.number().int().positive().nullable(),
});

export async function saveSpecialResults(input: unknown): Promise<{ ok: boolean; message?: string; error?: string }> {
  const session = await getCurrentSession();
  if (!session || session.user.role !== "superadmin") return { ok: false, error: "forbidden" };

  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const value = JSON.stringify(parsed.data);
  const now = Math.floor(Date.now() / 1000);
  await db.insert(schema.settings).values({ key: "special_results_json", value, updatedAt: now }).onConflictDoUpdate({
    target: schema.settings.key,
    set: { value, updatedAt: now },
  });

  const usersScored = await refreshRankingsSnapshot();
  await logAudit(session.user.id, "admin.special_results.update", null, { usersScored });
  return { ok: true, message: `${usersScored} usuários no ranking` };
}
