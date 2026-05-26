import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { encodeBase32LowerCaseNoPadding } from "@oslojs/encoding";
import * as schema from "../../src/lib/db/schema";
import { E2E_DB } from "./seed";

export function makeSessionFor(userId: string): string {
  const sqlite = new Database(E2E_DB);
  const db = drizzle(sqlite, { schema });
  const bytes = new Uint8Array(20);
  // E2E only — deterministic-ish randomness is fine
  for (let i = 0; i < 20; i++) bytes[i] = Math.floor(Math.random() * 256);
  const id = encodeBase32LowerCaseNoPadding(bytes);
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
  db.insert(schema.sessions).values({ id, userId, expiresAt }).run();
  sqlite.close();
  return id;
}
