import { db, schema } from "@/lib/db";

export async function isEmailDomainAllowed(email: string): Promise<boolean> {
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const domain = email.slice(at + 1).toLowerCase().trim();
  if (!domain) return false;

  const rows = await db.select().from(schema.allowedDomains);
  for (const row of rows) {
    const d = row.domain.toLowerCase();
    if (row.isWildcard) {
      if (domain === d || domain.endsWith("." + d)) return true;
    } else if (domain === d) {
      return true;
    }
  }
  return false;
}
