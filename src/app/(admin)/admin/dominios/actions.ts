"use server";

import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/log";
import { eq } from "drizzle-orm";
import { z } from "zod";

const Schema = z.object({
  domain: z.string().regex(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/i),
  isWildcard: z.boolean(),
});

async function requireSuperadmin() {
  const session = await getCurrentSession();
  if (!session || session.user.role !== "superadmin") throw new Error("forbidden");
  return session;
}

export async function addDomain(input: unknown): Promise<{ ok: boolean; error?: string; created?: { id: number; domain: string; isWildcard: number } }> {
  await requireSuperadmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Domínio inválido" };

  const domain = parsed.data.domain.trim().toLowerCase();
  const now = Math.floor(Date.now() / 1000);

  try {
    const result = await db.insert(schema.allowedDomains).values({
      domain, isWildcard: parsed.data.isWildcard ? 1 : 0, createdAt: now,
    }).returning();
    const row = result[0];
    const session = await getCurrentSession();
    await logAudit(session?.user.id ?? null, "admin.domain.add", domain, { isWildcard: parsed.data.isWildcard });
    return { ok: true, created: { id: row.id, domain: row.domain, isWildcard: row.isWildcard } };
  } catch {
    return { ok: false, error: "Domínio já existe" };
  }
}

export async function removeDomain(id: number): Promise<{ ok: boolean }> {
  const session = await requireSuperadmin();
  const target = await db.select().from(schema.allowedDomains).where(eq(schema.allowedDomains.id, id)).limit(1).then((r) => r[0]);
  await db.delete(schema.allowedDomains).where(eq(schema.allowedDomains.id, id));
  if (target) await logAudit(session.user.id, "admin.domain.remove", target.domain);
  return { ok: true };
}
