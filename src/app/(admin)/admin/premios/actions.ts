"use server";

import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/log";

export async function savePrizes(json: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getCurrentSession();
  if (!session || session.user.role !== "superadmin") return { ok: false, error: "forbidden" };
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return { ok: false, error: "Esperado um array" };
    for (const p of parsed) {
      if (typeof p?.position !== "number" || typeof p?.title !== "string") {
        return { ok: false, error: "Itens precisam de position (number) e title (string)" };
      }
      if (p?.link != null && typeof p.link !== "string") {
        return { ok: false, error: "link precisa ser uma string" };
      }
      if (p?.imageUrl != null && typeof p.imageUrl !== "string") {
        return { ok: false, error: "imageUrl precisa ser uma string" };
      }
      if (typeof p?.link === "string" && p.link.trim() && !/^https?:\/\//i.test(p.link.trim())) {
        return { ok: false, error: "Links devem começar com http:// ou https://" };
      }
    }
  } catch {
    return { ok: false, error: "JSON inválido" };
  }
  const now = Math.floor(Date.now() / 1000);
  await db.insert(schema.settings).values({ key: "prizes_json", value: json, updatedAt: now }).onConflictDoUpdate({
    target: schema.settings.key, set: { value: json, updatedAt: now },
  });
  await logAudit(session.user.id, "admin.prizes.update");
  return { ok: true };
}
