"use server";

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { getCurrentSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/log";

export async function resetUserPassword(
  userId: string,
): Promise<{ ok: boolean; password?: string; error?: string }> {
  const session = await getCurrentSession();
  if (!session || session.user.role !== "superadmin") {
    return { ok: false, error: "forbidden" };
  }

  const target = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1)
    .then((r) => r[0]);
  if (!target || target.deletedAt) return { ok: false, error: "Usuário não encontrado" };

  const tempPassword = `bolao-${nanoid(12)}`;
  const hash = await hashPassword(tempPassword);

  await db
    .update(schema.users)
    .set({ passwordHash: hash, passwordMustChange: 1 })
    .where(eq(schema.users.id, userId));

  await logAudit(session.user.id, "admin.user.password_reset", target.email);

  return { ok: true, password: tempPassword };
}
