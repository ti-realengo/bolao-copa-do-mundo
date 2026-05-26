"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/log";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function submitLogin(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const email = parsed.data.email.trim().toLowerCase();
  const generic = { ok: false, error: "Email ou senha inválidos" } as const;

  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)
    .then((r) => r[0]);

  if (!user || !user.passwordHash || user.deletedAt) return generic;

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    await logAudit(user.id, "auth.login.failed", user.email);
    return generic;
  }

  const now = Math.floor(Date.now() / 1000);
  await db.update(schema.users).set({ lastLoginAt: now }).where(eq(schema.users.id, user.id));
  await createSession(user.id);
  await logAudit(user.id, "auth.login.success", user.email);

  if (user.passwordMustChange) redirect("/perfil/senha");
  if (user.role === "superadmin") redirect("/admin");
  redirect("/home");
}
