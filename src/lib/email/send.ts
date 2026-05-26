import { Resend } from "resend";

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "bolao@localhost";

  if (!apiKey) {
    console.log("\n=== [DEV EMAIL] ===");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text ?? html.replace(/<[^>]+>/g, ""));
    console.log("===================\n");
    return { ok: true, dev: true };
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({ from, to, subject, html, text });
  return { ok: !result.error, dev: false, result };
}
