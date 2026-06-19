"use server";

import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/log";

interface R2Bucket {
  put(key: string, body: ArrayBuffer | Uint8Array, opts?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  list(opts?: { prefix?: string; limit?: number }): Promise<{ objects: { key: string; size: number; uploaded: Date }[] }>;
}

interface D1WithDump {
  dump(): Promise<ArrayBuffer>;
}

function isWorkerd(): boolean {
  return typeof (globalThis as { WebSocketPair?: unknown }).WebSocketPair !== "undefined";
}

async function getBucket(): Promise<R2Bucket | null> {
  if (!isWorkerd()) return null;
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const env = getCloudflareContext().env as unknown as { FILES?: R2Bucket };
    return env.FILES ?? null;
  } catch {
    return null;
  }
}

async function getD1(): Promise<D1WithDump | null> {
  if (!isWorkerd()) return null;
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const env = getCloudflareContext().env as unknown as { DB?: D1WithDump };
    return env.DB ?? null;
  } catch {
    return null;
  }
}

export async function backupToR2(): Promise<{ ok: true; filename: string } | { ok: false; error: string }> {
  const session = await getCurrentSession();
  if (!session || session.user.role !== "superadmin") return { ok: false, error: "forbidden" };

  const bucket = await getBucket();
  const d1 = await getD1();

  if (!bucket || !d1) {
    return { ok: false, error: "Backup disponível apenas em produção (R2/D1 não disponíveis em dev)" };
  }

  try {
    const dump = await d1.dump();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backups/bolao-prod-${timestamp}.sqlite`;

    await bucket.put(filename, dump, {
      httpMetadata: { contentType: "application/x-sqlite3" },
    });

    await logAudit(session.user.id, "admin.backup.create", filename, {
      sizeBytes: dump.byteLength,
    });

    return { ok: true, filename };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await logAudit(session.user.id, "admin.backup.error", null, { error: message });
    return { ok: false, error: message };
  }
}

export async function listBackups(): Promise<{ ok: true; backups: { key: string; size: number; uploaded: string }[] } | { ok: false; error: string }> {
  const session = await getCurrentSession();
  if (!session || session.user.role !== "superadmin") return { ok: false, error: "forbidden" };

  const bucket = await getBucket();
  if (!bucket) {
    return { ok: false, error: "R2 não disponível em dev" };
  }

  try {
    const result = await bucket.list({ prefix: "backups/", limit: 50 });
    const backups = result.objects
      .sort((a, b) => b.uploaded.getTime() - a.uploaded.getTime())
      .map((o) => ({
        key: o.key,
        size: o.size,
        uploaded: o.uploaded.toISOString(),
      }));
    return { ok: true, backups };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}