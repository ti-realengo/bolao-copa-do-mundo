import { brDateFormat } from "@/lib/date";

interface Branding {
  appUrl: string;
  companyName: string;
  primaryColor: string;
}

function shell(branding: Branding, title: string, body: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#fafaf7;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0e0f12;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e5e5dd;border-radius:16px;padding:24px;">
        <tr><td>
          <div style="font-weight:700;font-size:18px;color:${branding.primaryColor};margin-bottom:16px;">
            Bolão · ${branding.companyName}
          </div>
          ${body}
          <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e5dd;font-size:12px;color:#5c5f6a;">
            <a href="${branding.appUrl}/perfil" style="color:#5c5f6a;">Gerenciar preferências de email</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export interface MatchSummary {
  homeName: string;
  awayName: string;
  scheduledAt: number;
  group?: string | null;
  stage: string;
}

export function reminderEmail(branding: Branding, name: string, matches: MatchSummary[]): { subject: string; html: string; text: string } {
  const subject = `${matches.length} jogo${matches.length > 1 ? "s" : ""} sem palpite`;
  const fmt = brDateFormat({ weekday: "short", hour: "2-digit", minute: "2-digit" });
  const list = matches.map((m) => `
    <li style="padding:8px 0;border-bottom:1px solid #f0f0e8;">
      <strong>${m.homeName}</strong> × <strong>${m.awayName}</strong>
      <span style="color:#5c5f6a;font-size:13px;"> · ${fmt.format(new Date(m.scheduledAt * 1000))}</span>
    </li>
  `).join("");
  const body = `
    <p>Oi ${name},</p>
    <p>Você ainda não palpitou nestes jogos das próximas 12h:</p>
    <ul style="list-style:none;padding:0;margin:16px 0;">${list}</ul>
    <p style="margin:24px 0;">
      <a href="${branding.appUrl}/jogos" style="display:inline-block;background:${branding.primaryColor};color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;">Palpitar agora</a>
    </p>
  `;
  const text = `Oi ${name}, palpites pendentes:\n${matches.map((m) => `- ${m.homeName} × ${m.awayName} (${fmt.format(new Date(m.scheduledAt * 1000))})`).join("\n")}\n\n${branding.appUrl}/jogos`;
  return { subject, html: shell(branding, subject, body), text };
}

export interface DayResult {
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
}

export interface TopUser {
  name: string;
  points: number;
}

export function recapEmail(branding: Branding, name: string, results: DayResult[], top: TopUser[]): { subject: string; html: string; text: string } {
  const subject = `Recap do dia · ${results.length} jogo${results.length > 1 ? "s" : ""}`;
  const resultsList = results.map((r) => `
    <li style="padding:8px 0;border-bottom:1px solid #f0f0e8;">
      ${r.homeName} <strong style="font-family:ui-monospace,monospace;">${r.homeScore}–${r.awayScore}</strong> ${r.awayName}
    </li>
  `).join("");
  const topList = top.map((u, i) => `
    <li style="padding:8px 0;">
      <span style="color:${branding.primaryColor};font-weight:700;">${i + 1}º</span> ${u.name}
      <span style="color:#5c5f6a;font-family:ui-monospace,monospace;float:right;">${u.points} pts</span>
    </li>
  `).join("");
  const body = `
    <p>Oi ${name}, recap do dia:</p>
    <h3 style="font-size:14px;text-transform:uppercase;color:#5c5f6a;margin-top:24px;">Resultados</h3>
    <ul style="list-style:none;padding:0;">${resultsList}</ul>
    <h3 style="font-size:14px;text-transform:uppercase;color:#5c5f6a;margin-top:24px;">Top 5 do dia</h3>
    <ul style="list-style:none;padding:0;">${topList}</ul>
    <p style="margin:24px 0;">
      <a href="${branding.appUrl}/ranking" style="display:inline-block;background:${branding.primaryColor};color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;">Ver ranking completo</a>
    </p>
  `;
  const text = `Recap do dia\n\nResultados:\n${results.map((r) => `${r.homeName} ${r.homeScore}-${r.awayScore} ${r.awayName}`).join("\n")}\n\nTop 5:\n${top.map((u, i) => `${i + 1}. ${u.name} (${u.points} pts)`).join("\n")}\n\n${branding.appUrl}/ranking`;
  return { subject, html: shell(branding, subject, body), text };
}
