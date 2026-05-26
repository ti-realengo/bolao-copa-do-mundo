"use server";

import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { and, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(280).optional(),
  isOpen: z.boolean().default(true),
});

const JoinSchema = z.object({
  inviteCode: z.string().min(4).max(40),
});

function makeInviteCode(): string {
  const part = () => nanoid(4).toUpperCase().replace(/[_-]/g, "X");
  return `bola-${part()}-${part()}`;
}

export async function createLeague(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const session = await getCurrentSession();
  if (!session) return { ok: false, error: "unauthenticated" };

  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const ownedCount = await db
    .select({ c: sql<number>`count(*)` })
    .from(schema.leagues)
    .where(eq(schema.leagues.ownerId, session.user.id))
    .then((r) => Number(r[0]?.c ?? 0));
  if (ownedCount >= 3) return { ok: false, error: "Limite de 3 grupos por usuário" };

  const id = nanoid(12);
  const now = Math.floor(Date.now() / 1000);
  await db.insert(schema.leagues).values({
    id,
    name: parsed.data.name.trim(),
    description: parsed.data.description?.trim(),
    ownerId: session.user.id,
    inviteCode: makeInviteCode(),
    isOpen: parsed.data.isOpen ? 1 : 0,
    createdAt: now,
  });
  await db.insert(schema.leagueMembers).values({
    leagueId: id,
    userId: session.user.id,
    joinedAt: now,
  });
  redirect(`/grupos/${id}`);
}

export async function joinLeague(input: unknown): Promise<{ ok: boolean; error?: string; leagueId?: string }> {
  const session = await getCurrentSession();
  if (!session) return { ok: false, error: "unauthenticated" };

  const parsed = JoinSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Código inválido" };

  const code = parsed.data.inviteCode.trim();
  const league = await db
    .select()
    .from(schema.leagues)
    .where(eq(schema.leagues.inviteCode, code))
    .limit(1)
    .then((r) => r[0]);

  if (!league) return { ok: false, error: "Grupo não encontrado" };

  const memberCount = await db
    .select({ c: sql<number>`count(*)` })
    .from(schema.leagueMembers)
    .where(eq(schema.leagueMembers.leagueId, league.id))
    .then((r) => Number(r[0]?.c ?? 0));

  if (memberCount >= league.maxMembers) return { ok: false, error: "Grupo cheio" };

  const already = await db
    .select()
    .from(schema.leagueMembers)
    .where(and(eq(schema.leagueMembers.leagueId, league.id), eq(schema.leagueMembers.userId, session.user.id)))
    .limit(1);

  if (already.length === 0) {
    await db.insert(schema.leagueMembers).values({
      leagueId: league.id,
      userId: session.user.id,
      joinedAt: Math.floor(Date.now() / 1000),
    });
  }

  return { ok: true, leagueId: league.id };
}

export async function leaveLeague(leagueId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getCurrentSession();
  if (!session) return { ok: false, error: "unauthenticated" };

  const league = await db.select().from(schema.leagues).where(eq(schema.leagues.id, leagueId)).limit(1).then((r) => r[0]);
  if (!league) return { ok: false, error: "Grupo não existe" };
  if (league.ownerId === session.user.id) return { ok: false, error: "Dono não pode sair (transfira ou arquive)" };

  await db
    .delete(schema.leagueMembers)
    .where(and(eq(schema.leagueMembers.leagueId, leagueId), eq(schema.leagueMembers.userId, session.user.id)));
  redirect("/grupos");
}
