"use server";

import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { isEmailDomainAllowed } from "@/lib/auth/domains";
import { logAudit } from "@/lib/audit/log";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(12, "Senha precisa ter pelo menos 12 caracteres"),
  name: z.string().trim().min(2, "Nome precisa ter pelo menos 2 caracteres").max(50),
  consent: z.literal(true, {
    errorMap: () => ({ message: "É preciso aceitar os termos pra continuar" }),
  }),
});

export async function submitSignup(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Dados inválidos" };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const domain = email.split("@")[1];
  if (!domain) return { ok: false, error: "Email inválido" };

  // Check if anyone exists yet — first signup becomes superadmin.
  const userCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.users)
    .then((r) => Number(r[0]?.count ?? 0));
  const isFirst = userCount === 0;

  if (!isFirst) {
    const allowed = await isEmailDomainAllowed(email);
    if (!allowed) {
      return {
        ok: false,
        error: "Domínio do email não está autorizado. Peça pro admin liberar o domínio.",
      };
    }

    const existing = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1)
      .then((r) => r[0]);
    if (existing) {
      return { ok: false, error: "Já existe uma conta com esse email" };
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const passwordHash = await hashPassword(parsed.data.password);
  const userId = nanoid(21);

  await db.insert(schema.users).values({
    id: userId,
    email,
    name: parsed.data.name.trim(),
    role: isFirst ? "superadmin" : "participant",
    passwordHash,
    passwordMustChange: 0,
    consentLgpd: 1,
    consentLgpdAt: now,
    createdAt: now,
    lastLoginAt: now,
  });

  if (isFirst) {
    // Auto-add the superadmin's domain to the allowlist so colleagues can sign up next.
    const existingDomain = await db
      .select()
      .from(schema.allowedDomains)
      .where(eq(schema.allowedDomains.domain, domain))
      .limit(1)
      .then((r) => r[0]);
    if (!existingDomain) {
      await db.insert(schema.allowedDomains).values({
        domain,
        isWildcard: 0,
        createdAt: now,
      });
    }
    await logAudit(userId, "auth.signup.superadmin", email, { domain });
  } else {
    await logAudit(userId, "auth.signup", email);
  }

  await createSession(userId);

  if (isFirst) redirect("/admin");
  redirect("/home");
}
