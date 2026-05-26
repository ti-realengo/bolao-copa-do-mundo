"use server";

import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/log";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const PostSchema = z.object({
  matchId: z.number().int().positive(),
  body: z.string().trim().min(2).max(280),
});

export async function postComment(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const session = await getCurrentSession();
  if (!session) return { ok: false, error: "unauthenticated" };

  const parsed = PostSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Comentário inválido" };

  const match = await db.select().from(schema.matches).where(eq(schema.matches.id, parsed.data.matchId)).limit(1).then((r) => r[0]);
  if (!match) return { ok: false, error: "Jogo não encontrado" };

  const now = Math.floor(Date.now() / 1000);
  if (now < match.scheduledAt) return { ok: false, error: "Comentários abrem após o início" };

  const existing = await db
    .select()
    .from(schema.matchComments)
    .where(and(eq(schema.matchComments.matchId, parsed.data.matchId), eq(schema.matchComments.userId, session.user.id)))
    .limit(1);

  if (existing.length > 0) return { ok: false, error: "Você já comentou neste jogo" };

  await db.insert(schema.matchComments).values({
    matchId: parsed.data.matchId,
    userId: session.user.id,
    body: parsed.data.body,
    createdAt: now,
  });

  revalidatePath(`/jogos/${parsed.data.matchId}`);
  return { ok: true };
}

export async function deleteComment(commentId: number): Promise<{ ok: boolean }> {
  const session = await getCurrentSession();
  if (!session) return { ok: false };

  const c = await db.select().from(schema.matchComments).where(eq(schema.matchComments.id, commentId)).limit(1).then((r) => r[0]);
  if (!c || c.userId !== session.user.id) return { ok: false };

  await db.delete(schema.matchComments).where(eq(schema.matchComments.id, commentId));
  revalidatePath(`/jogos/${c.matchId}`);
  return { ok: true };
}

export async function hideComment(commentId: number): Promise<{ ok: boolean }> {
  const session = await getCurrentSession();
  if (!session || session.user.role !== "superadmin") return { ok: false };

  const c = await db.select().from(schema.matchComments).where(eq(schema.matchComments.id, commentId)).limit(1).then((r) => r[0]);
  if (!c) return { ok: false };

  await db.update(schema.matchComments).set({ hiddenAt: Math.floor(Date.now() / 1000) }).where(eq(schema.matchComments.id, commentId));
  await logAudit(session.user.id, "admin.comment.hide", String(commentId));
  revalidatePath(`/jogos/${c.matchId}`);
  return { ok: true };
}
