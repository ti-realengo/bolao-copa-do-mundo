import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

function run(cmd: string): string {
  console.log(`> ${cmd}`);
  return execSync(cmd, { encoding: "utf-8" });
}

function safe(cmd: string): string | null {
  try {
    return run(cmd);
  } catch (e) {
    console.warn(`  (failed) ${(e as Error).message.split("\n")[0]}`);
    return null;
  }
}

function extractId(output: string, key: "database_id" | "id"): string | null {
  const m = new RegExp(`"${key}":\\s*"([^"]+)"`).exec(output) ?? new RegExp(`${key}\\s*=\\s*"([^"]+)"`).exec(output);
  return m?.[1] ?? null;
}

function patchToml(replacements: Record<string, string>) {
  const path = "wrangler.toml";
  let toml = readFileSync(path, "utf-8");
  for (const [placeholder, value] of Object.entries(replacements)) {
    if (toml.includes(placeholder)) {
      toml = toml.replaceAll(placeholder, value);
      console.log(`  ✓ ${placeholder} → ${value.slice(0, 12)}…`);
    }
  }
  writeFileSync(path, toml);
}

console.log("Cloudflare bootstrap — cria recursos D1/KV/R2 e atualiza wrangler.toml\n");

console.log("→ D1 database");
const d1Out = safe("wrangler d1 create bolao-prod");
if (d1Out) {
  const id = extractId(d1Out, "database_id");
  if (id) patchToml({ REPLACE_WITH_D1_ID: id });
}

console.log("\n→ KV namespace");
const kvOut = safe("wrangler kv namespace create CACHE");
if (kvOut) {
  const id = extractId(kvOut, "id");
  if (id) patchToml({ REPLACE_WITH_KV_ID: id });
}

console.log("\n→ R2 bucket");
safe("wrangler r2 bucket create bolao-files");

console.log("\nProntos. Próximos passos manuais:");
console.log("  1) wrangler d1 migrations apply bolao-prod --remote");
console.log("  2) Configure secrets obrigatórios:");
console.log("     wrangler secret put SESSION_SECRET");
console.log("     wrangler secret put FOOTBALL_DATA_API_KEY");
console.log("     wrangler secret put CRON_SECRET");
console.log("     # opcionais (emails de notificação):");
console.log("     wrangler secret put RESEND_API_KEY");
console.log("     wrangler secret put RESEND_FROM_EMAIL");
console.log("  3) pnpm cf:deploy");
console.log("  4) Acesse https://<seu-worker>.workers.dev/cadastro — o primeiro");
console.log("     usuário a se cadastrar vira superadmin automaticamente.");
