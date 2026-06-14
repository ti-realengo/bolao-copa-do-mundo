import * as schema from "./schema";

export { schema };
export type Schema = typeof schema;

declare global {
  interface D1Database {
    prepare(query: string): unknown;
  }
  // eslint-disable-next-line no-var
  var __bolaoDb: unknown | undefined;
}

type DbInstance = ReturnType<typeof import("drizzle-orm/better-sqlite3").drizzle<typeof schema>>;

function shouldUseD1(): boolean {
  if (process.env.DB_DRIVER === "d1") return true;
  if (typeof process !== "undefined" && process.env.NEXT_RUNTIME === "edge") return true;
  if (typeof (globalThis as { WebSocketPair?: unknown }).WebSocketPair !== "undefined") return true;
  return false;
}

function buildLocal(): DbInstance {
  const Database = require("better-sqlite3") as typeof import("better-sqlite3");
  const { drizzle } = require("drizzle-orm/better-sqlite3") as typeof import("drizzle-orm/better-sqlite3");
  const dbUrl = process.env.DATABASE_URL ?? "./data/bolao.db";
  const sqlite = new Database(dbUrl);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

function buildD1(): DbInstance {
  const { getCloudflareContext } = require("@opennextjs/cloudflare") as typeof import("@opennextjs/cloudflare");
  const { drizzle } = require("drizzle-orm/d1") as typeof import("drizzle-orm/d1");
  const env = getCloudflareContext().env as unknown as { DB: D1Database };
  if (!env.DB) throw new Error("D1 binding 'DB' não encontrado");
  return drizzle(env.DB, { schema }) as unknown as DbInstance;
}

function build(): DbInstance {
  return shouldUseD1() ? buildD1() : buildLocal();
}

export function getDb(): DbInstance {
  if (!global.__bolaoDb) {
    global.__bolaoDb = build();
  }
  return global.__bolaoDb as DbInstance;
}

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

export const db: DbInstance = new Proxy({} as DbInstance, {
  get(_t, prop, receiver) {
    if (isBuildPhase()) return undefined;
    if (typeof prop === "symbol") return undefined;
    return Reflect.get(getDb() as object, prop, receiver);
  },
}) as DbInstance;

// Runs multiple Drizzle queries in a single D1 batch round-trip when on Workers,
// or sequentially when running locally with better-sqlite3.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runBatch(queries: any[]): Promise<void> {
  if (queries.length === 0) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instance = getDb() as any;
  if (typeof instance.batch === "function") {
    try {
      await instance.batch(queries);
    } catch (e) {
      console.error(`[runBatch] D1 batch failed (${queries.length} queries), falling back to sequential:`, e instanceof Error ? e.message : e);
      for (const q of queries) {
        await q;
      }
    }
  } else {
    for (const q of queries) {
      await q;
    }
  }
}