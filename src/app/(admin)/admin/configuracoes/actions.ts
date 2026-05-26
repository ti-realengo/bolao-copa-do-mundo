"use server";

import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/log";

export async function saveSettings(values: Record<string, string>): Promise<{ ok: boolean }> {
  const session = await getCurrentSession();
  if (!session || session.user.role !== "superadmin") return { ok: false };

  const now = Math.floor(Date.now() / 1000);
  for (const [key, value] of Object.entries(values)) {
    await db.insert(schema.settings).values({ key, value, updatedAt: now }).onConflictDoUpdate({
      target: schema.settings.key,
      set: { value, updatedAt: now },
    });
  }
  await logAudit(session.user.id, "admin.settings.update", null, { keys: Object.keys(values) });
  return { ok: true };
}
