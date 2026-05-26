"use server";

import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/log";
import { sendEmail } from "@/lib/email/send";
import { loadBranding } from "@/lib/email/branding";
import { parsePrefs } from "@/lib/email/prefs";
import { log } from "@/lib/observability/logger";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

const Schema = z.object({
  subject: z.string().min(2).max(120),
  body: z.string().min(10).max(3000),
});

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export async function sendBroadcast(input: unknown): Promise<{ ok: boolean; sent?: number; error?: string }> {
  const session = await getCurrentSession();
  if (!session || session.user.role !== "superadmin") return { ok: false, error: "forbidden" };

  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Mensagem inválida" };

  const branding = await loadBranding();

  const users = await db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.role, "participant"), isNull(schema.users.deletedAt)));

  const htmlBody = parsed.data.body
    .split("\n\n")
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const html = `
<!doctype html>
<html><body style="margin:0;padding:0;background:#fafaf7;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0e0f12;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e5e5dd;border-radius:16px;padding:24px;">
        <tr><td>
          <div style="font-weight:700;font-size:18px;color:${branding.primaryColor};margin-bottom:16px;">
            Bolão · ${escapeHtml(branding.companyName)}
          </div>
          ${htmlBody}
          <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e5dd;font-size:12px;color:#5c5f6a;">
            <a href="${branding.appUrl}/perfil" style="color:#5c5f6a;">Gerenciar preferências de email</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const now = Math.floor(Date.now() / 1000);
  let sent = 0;
  let skipped = 0;

  for (const u of users) {
    const prefs = parsePrefs(u.emailPrefsJson);
    if (!prefs.broadcast) {
      skipped++;
      continue;
    }
    try {
      await sendEmail({ to: u.email, subject: parsed.data.subject, html, text: parsed.data.body });
      await db.insert(schema.emailDispatches).values({
        userId: u.id,
        template: "broadcast",
        contextJson: JSON.stringify({ subject: parsed.data.subject }),
        sentAt: now,
        status: "sent",
      });
      sent++;
    } catch (e) {
      log.error("broadcast.send failed", e, { userId: u.id });
      await db.insert(schema.emailDispatches).values({
        userId: u.id,
        template: "broadcast",
        contextJson: JSON.stringify({ subject: parsed.data.subject, error: (e as Error).message }),
        status: "failed",
      });
    }
  }

  await logAudit(session.user.id, "admin.broadcast.send", null, {
    subject: parsed.data.subject,
    sent,
    skipped,
    total: users.length,
  });
  log.info("admin.broadcast.send", { sent, skipped, total: users.length });

  return { ok: true, sent };
}
