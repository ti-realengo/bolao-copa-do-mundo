/**
 * Storage abstraction for uploaded files (logos, avatars, OG images, etc.).
 *
 * - In production (Cloudflare Workers / OpenNext) it writes to the R2 bucket
 *   bound as `FILES` in wrangler.toml.
 * - In local dev (Node.js) it falls back to the public/ directory so
 *   `next dev` can serve the file directly.
 *
 * Returned URL is always `/uploads/<key>`. In production that path is served
 * by the catch-all route at src/app/uploads/[...path]/route.ts which streams
 * the object from R2; in dev it's a static file Next.js serves from public/.
 */

interface R2Bucket {
  put(key: string, body: ArrayBuffer | Uint8Array, opts?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
}
interface R2ObjectBody {
  body: ReadableStream<Uint8Array>;
  size: number;
  httpMetadata?: { contentType?: string };
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

export async function putUpload(
  key: string,
  bytes: ArrayBuffer,
  contentType: string,
): Promise<void> {
  const bucket = await getBucket();
  if (bucket) {
    await bucket.put(key, bytes, { httpMetadata: { contentType } });
    return;
  }
  // Local dev fallback: write into public/uploads so Next.js serves it directly.
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const target = path.join(process.cwd(), "public", "uploads", key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, Buffer.from(bytes));
}

export async function getUpload(
  key: string,
): Promise<{ body: ReadableStream<Uint8Array>; size: number; contentType?: string } | null> {
  const bucket = await getBucket();
  if (bucket) {
    const obj = await bucket.get(key);
    if (!obj) return null;
    return { body: obj.body, size: obj.size, contentType: obj.httpMetadata?.contentType };
  }
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const target = path.join(process.cwd(), "public", "uploads", key);
  try {
    const data = await fs.readFile(target);
    return {
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(data));
          controller.close();
        },
      }),
      size: data.byteLength,
    };
  } catch {
    return null;
  }
}

export function uploadUrl(key: string): string {
  return `/uploads/${key}`;
}
