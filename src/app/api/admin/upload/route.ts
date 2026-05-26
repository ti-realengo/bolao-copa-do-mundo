import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getCurrentSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/log";
import { putUpload, uploadUrl } from "@/lib/storage";

export const runtime = "nodejs";

const ALLOWED = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);
const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const folderRaw = form.get("folder");
  const folder = typeof folderRaw === "string" && /^[a-z0-9-]{1,32}$/.test(folderRaw) ? folderRaw : "misc";

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Arquivo ausente" }, { status: 400 });
  }
  const ext = ALLOWED.get(file.type);
  if (!ext) {
    return NextResponse.json({ ok: false, error: "Formato não suportado (use PNG, JPG, WebP ou GIF)" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "Arquivo maior que 2 MB" }, { status: 400 });
  }

  const filename = `${nanoid(16)}.${ext}`;
  const key = `${folder}/${filename}`;

  try {
    await putUpload(key, await file.arrayBuffer(), file.type);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: `Falha ao salvar: ${(e as Error).message}` },
      { status: 500 },
    );
  }

  await logAudit(session.user.id, "admin.upload", null, { folder, filename, size: file.size });

  return NextResponse.json({ ok: true, url: uploadUrl(key) });
}
