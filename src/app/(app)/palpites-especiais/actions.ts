"use server";

import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

const Schema = z.object({
  championTeamId: z.number().int().positive().nullable(),
  runnerupTeamId: z.number().int().positive().nullable(),
  thirdTeamId: z.number().int().positive().nullable(),
  topScorerName: z.string().max(80).optional().nullable().transform((v) => v?.trim() || null),
  firstEliminatedTeamId: z.number().int().positive().nullable(),
  surpriseTeamId: z.number().int().positive().nullable(),
});

export async function saveSpecials(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const session = await getCurrentSession();
  if (!session) return { ok: false, error: "unauthenticated" };

  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const firstMatch = await db
    .select({ at: schema.matches.scheduledAt })
    .from(schema.matches)
    .orderBy(asc(schema.matches.scheduledAt))
    .limit(1)
    .then((r) => r[0]);

  const now = Math.floor(Date.now() / 1000);
  if (firstMatch && now >= firstMatch.at) {
    return { ok: false, error: "Trancado — a Copa começou" };
  }

  const existing = await db
    .select()
    .from(schema.specialPredictions)
    .where(eq(schema.specialPredictions.userId, session.user.id))
    .limit(1)
    .then((r) => r[0]);

  if (existing?.lockedAt) return { ok: false, error: "Palpites trancados" };

  if (existing) {
    await db
      .update(schema.specialPredictions)
      .set(parsed.data)
      .where(eq(schema.specialPredictions.userId, session.user.id));
  } else {
    await db.insert(schema.specialPredictions).values({
      userId: session.user.id,
      ...parsed.data,
    });
  }
  return { ok: true };
}
