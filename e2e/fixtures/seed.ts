import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync, unlinkSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { nanoid } from "nanoid";
import * as schema from "../../src/lib/db/schema";
import { hashPassword } from "../../src/lib/auth/password";

export const E2E_DB = "./data/e2e.db";

export function resetDb() {
  const path = E2E_DB;
  for (const ext of ["", "-wal", "-shm", "-journal"]) {
    const p = `${path}${ext}`;
    if (existsSync(p)) unlinkSync(p);
  }
  mkdirSync(dirname(path), { recursive: true });

  const sqlite = new Database(path);
  sqlite.pragma("foreign_keys = ON");

  const dir = join(process.cwd(), "drizzle");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    const sql = readFileSync(join(dir, f), "utf-8");
    const stmts = sql.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
    for (const s of stmts) sqlite.exec(s);
  }

  const db = drizzle(sqlite, { schema });
  const now = Math.floor(Date.now() / 1000);

  db.insert(schema.teams).values([
    { id: 1, code: "BRA", namePt: "Brasil", nameEn: "Brazil", nameEs: "Brasil", flagUrl: null, groupCode: "C" },
    { id: 2, code: "ARG", namePt: "Argentina", nameEn: "Argentina", nameEs: "Argentina", flagUrl: null, groupCode: "D" },
    { id: 3, code: "FRA", namePt: "França", nameEn: "France", nameEs: "Francia", flagUrl: null, groupCode: "C" },
    { id: 4, code: "GER", namePt: "Alemanha", nameEn: "Germany", nameEs: "Alemania", flagUrl: null, groupCode: "D" },
  ]).run();

  const future = now + 3600 * 24;
  db.insert(schema.matches).values([
    { externalId: "e2e-1", stage: "group", groupCode: "C", round: 1, homeTeamId: 1, awayTeamId: 3, scheduledAt: future, status: "scheduled" },
    { externalId: "e2e-2", stage: "group", groupCode: "D", round: 1, homeTeamId: 2, awayTeamId: 4, scheduledAt: future + 3600, status: "scheduled" },
  ]).run();

  sqlite.close();
}

export function seedAllowedDomain(domain: string) {
  const sqlite = new Database(E2E_DB);
  const db = drizzle(sqlite, { schema });
  const now = Math.floor(Date.now() / 1000);
  db.insert(schema.allowedDomains).values({ domain, isWildcard: 0, createdAt: now }).run();
  sqlite.close();
}

export interface SeededUser {
  id: string;
  email: string;
  name: string;
}

export function seedUser(email: string, name: string): SeededUser {
  const sqlite = new Database(E2E_DB);
  const db = drizzle(sqlite, { schema });
  const now = Math.floor(Date.now() / 1000);
  const id = nanoid(21);
  db.insert(schema.users).values({
    id,
    email: email.toLowerCase(),
    name,
    role: "participant",
    consentLgpd: 1,
    consentLgpdAt: now,
    createdAt: now,
  }).run();
  sqlite.close();
  return { id, email: email.toLowerCase(), name };
}

export async function seedUserWithPassword(
  email: string,
  name: string,
  password: string,
  role: "participant" | "superadmin" = "participant",
): Promise<SeededUser> {
  const sqlite = new Database(E2E_DB);
  const db = drizzle(sqlite, { schema });
  const now = Math.floor(Date.now() / 1000);
  const id = nanoid(21);
  const passwordHash = await hashPassword(password);
  db.insert(schema.users).values({
    id,
    email: email.toLowerCase(),
    name,
    role,
    passwordHash,
    consentLgpd: 1,
    consentLgpdAt: now,
    createdAt: now,
  }).run();
  sqlite.close();
  return { id, email: email.toLowerCase(), name };
}

export function countUsers(): number {
  const sqlite = new Database(E2E_DB);
  try {
    const row = sqlite.prepare("SELECT count(*) as c FROM users").get() as { c: number };
    return row.c;
  } finally {
    sqlite.close();
  }
}

export function getUserRole(email: string): string | null {
  const sqlite = new Database(E2E_DB);
  try {
    const row = sqlite
      .prepare("SELECT role FROM users WHERE email = ?")
      .get(email.toLowerCase()) as { role: string } | undefined;
    return row?.role ?? null;
  } finally {
    sqlite.close();
  }
}

export function isDomainAllowed(domain: string): boolean {
  const sqlite = new Database(E2E_DB);
  try {
    const row = sqlite
      .prepare("SELECT 1 FROM allowed_domains WHERE domain = ?")
      .get(domain) as unknown;
    return Boolean(row);
  } finally {
    sqlite.close();
  }
}
