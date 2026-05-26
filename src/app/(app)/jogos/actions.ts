"use server";

import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { evaluateMadrugador } from "@/lib/badges/evaluate";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const Schema = z.object({
  matchId: z.number().int().positive(),
  homeScore: z.number().int().min(0).max(20),
  awayScore: z.number().int().min(0).max(20),
  advancingTeamId: z.number().int().positive().nullable().optional(),
});

const DEADLINE_OFFSET_SECONDS = 15 * 60;

export async function savePrediction(input: z.infer<typeof Schema>): Promise<{ ok: boolean; error?: string }> {
  const session = await getCurrentSession();
  if (!session) return { ok: false, error: "unauthenticated" };

  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const match = await db.select().from(schema.matches).where(eq(schema.matches.id, parsed.data.matchId)).limit(1).then((r) => r[0]);
  if (!match) return { ok: false, error: "match-not-found" };

  const now = Math.floor(Date.now() / 1000);
  if (now > match.scheduledAt - DEADLINE_OFFSET_SECONDS) {
    return { ok: false, error: "deadline-passed" };
  }
  if (match.status !== "scheduled") return { ok: false, error: "not-open" };

  const existing = await db.select().from(schema.predictions).where(
    and(eq(schema.predictions.userId, session.user.id), eq(schema.predictions.matchId, parsed.data.matchId)),
  ).limit(1).then((r) => r[0]);

  if (existing) {
    await db.update(schema.predictions).set({
      homeScore: parsed.data.homeScore,
      awayScore: parsed.data.awayScore,
      advancingTeamId: parsed.data.advancingTeamId ?? null,
      updatedAt: now,
    }).where(eq(schema.predictions.id, existing.id));
  } else {
    await db.insert(schema.predictions).values({
      userId: session.user.id,
      matchId: parsed.data.matchId,
      homeScore: parsed.data.homeScore,
      awayScore: parsed.data.awayScore,
      advancingTeamId: parsed.data.advancingTeamId ?? null,
      createdAt: now,
      updatedAt: now,
    });
    await evaluateMadrugador(parsed.data.matchId, session.user.id);
  }
  return { ok: true };
}
