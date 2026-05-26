import { NextRequest } from "next/server";
import { getUpload } from "@/lib/storage";

export const runtime = "nodejs";

const EXT_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const key = path.join("/");

  // Reject path traversal attempts; keys come from our own /api/admin/upload
  // and /api/upload/avatar handlers and are nanoid-based, so '..' or backslash
  // never appears in legitimate keys.
  if (key.includes("..") || key.includes("\\")) {
    return new Response("invalid path", { status: 400 });
  }

  const obj = await getUpload(key);
  if (!obj) return new Response("not found", { status: 404 });

  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  const contentType = obj.contentType ?? EXT_MIME[ext] ?? "application/octet-stream";

  return new Response(obj.body, {
    headers: {
      "content-type": contentType,
      "content-length": String(obj.size),
      "cache-control": "public, max-age=3600",
    },
  });
}
