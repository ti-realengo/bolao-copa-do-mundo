import { db, schema } from "@/lib/db";
import { headers } from "next/headers";
import { hashIp } from "@/lib/auth/tokens";

export async function logAudit(
  userId: string | null,
  action: string,
  target?: string | null,
  metadata?: Record<string, unknown>,
) {
  let ipHash: string | null = null;
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip");
    ipHash = hashIp(ip);
  } catch {}

  await db.insert(schema.auditLog).values({
    userId,
    action,
    target: target ?? null,
    metadataJson: metadata ? JSON.stringify(metadata) : null,
    ipHash,
    createdAt: Math.floor(Date.now() / 1000),
  });
}
