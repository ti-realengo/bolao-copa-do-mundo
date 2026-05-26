import Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const dbUrl = process.env.DATABASE_URL ?? "./data/bolao.db";
mkdirSync(dirname(dbUrl), { recursive: true });

const sqlite = new Database(dbUrl);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite);
migrate(db, { migrationsFolder: "./drizzle" });
console.log(`✓ migrations applied to ${dbUrl}`);
sqlite.close();
