import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getCurrentSession } from "@/lib/auth/session";
import { putUpload, uploadUrl } from "@/lib/storage";

export const runtime = "nodejs";

const ALLOWED = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);
const MAX_BYTES = 1.5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Arquivo ausente" }, { status: 400 });
  }
  const ext = ALLOWED.get(file.type);
  if (!ext) {
    return NextResponse.json({ ok: false, error: "Formato não suportado (PNG, JPG, WebP, GIF)" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "Arquivo maior que 1,5 MB" }, { status: 400 });
  }

  const filename = `${nanoid(16)}.${ext}`;
  const key = `avatars/${filename}`;

  try {
    await putUpload(key, await file.arrayBuffer(), file.type);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: `Falha ao salvar: ${(e as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, url: uploadUrl(key) });
}
