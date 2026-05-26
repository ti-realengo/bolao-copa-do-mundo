"use server";

import { db, schema } from "@/lib/db";
import { getCurrentSession, destroyCurrentSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { logAudit } from "@/lib/audit/log";
import { LOCALES } from "@/lib/i18n";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

const ProfileSchema = z.object({
  name: z.string().min(2).max(50),
  avatarUrl: z.string().max(500).optional().nullable(),
});

export async function saveProfile(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const session = await getCurrentSession();
  if (!session) return { ok: false, error: "unauthenticated" };

  const parsed = ProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const avatarUrl = parsed.data.avatarUrl?.trim() || null;
  if (avatarUrl && !/^\/uploads\/avatars\//.test(avatarUrl) && !/^https?:\/\//i.test(avatarUrl)) {
    return { ok: false, error: "URL de avatar inválida" };
  }

  await db
    .update(schema.users)
    .set({ name: parsed.data.name.trim(), avatarUrl })
    .where(eq(schema.users.id, session.user.id));

  await logAudit(session.user.id, "user.profile.update");
  return { ok: true };
}

const PasswordSchema = z.object({
  current: z.string().optional(),
  next: z.string().min(12),
});

export async function changeOwnPassword(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const session = await getCurrentSession();
  if (!session) return { ok: false, error: "unauthenticated" };

  const parsed = PasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Senha precisa ter no mínimo 12 caracteres" };

  if (session.user.passwordHash) {
    if (!parsed.data.current) return { ok: false, error: "Informe a senha atual" };
    const valid = await verifyPassword(parsed.data.current, session.user.passwordHash);
    if (!valid) return { ok: false, error: "Senha atual incorreta" };
  }

  const newHash = await hashPassword(parsed.data.next);
  await db
    .update(schema.users)
    .set({ passwordHash: newHash, passwordMustChange: 0 })
    .where(eq(schema.users.id, session.user.id));

  await logAudit(session.user.id, "user.password.change");
  return { ok: true };
}

const Schema = z.object({
  reminders: z.boolean(),
  recap: z.boolean(),
  broadcast: z.boolean(),
});

export async function saveEmailPrefs(input: unknown): Promise<{ ok: boolean }> {
  const session = await getCurrentSession();
  if (!session) return { ok: false };

  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { ok: false };

  await db
    .update(schema.users)
    .set({ emailPrefsJson: JSON.stringify(parsed.data) })
    .where(eq(schema.users.id, session.user.id));
  return { ok: true };
}

export async function saveLocale(locale: string): Promise<{ ok: boolean }> {
  if (!(LOCALES as readonly string[]).includes(locale)) return { ok: false };
  const cookieStore = await cookies();
  cookieStore.set("bolao_locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return { ok: true };
}

export async function deleteAccount(): Promise<void> {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.user.role === "superadmin") {
    throw new Error("Superadmin não pode excluir a conta pelo painel.");
  }

  const now = Math.floor(Date.now() / 1000);
  const anonEmail = `deleted-${session.user.id}@example.invalid`;

  await db
    .update(schema.users)
    .set({ deletedAt: now, name: null, phone: null, email: anonEmail })
    .where(eq(schema.users.id, session.user.id));

  await db.delete(schema.sessions).where(eq(schema.sessions.userId, session.user.id));
  await logAudit(session.user.id, "user.account.delete");
  await destroyCurrentSession();
  redirect("/login");
}
