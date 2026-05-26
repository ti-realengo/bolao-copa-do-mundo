import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import * as schema from "../../db/schema";
import { scorePrediction } from "../engine";

type Db = BetterSQLite3Database<typeof schema>;

function makeDb(): { db: Db; sqlite: Database.Database } {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");

  const dir = join(process.cwd(), "drizzle");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    const sql = readFileSync(join(dir, f), "utf-8");
    const statements = sql.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      sqlite.exec(stmt);
    }
  }
  return { db: drizzle(sqlite, { schema }), sqlite };
}

describe("scoring pipeline (integration)", () => {
  let db: Db;

  beforeEach(() => {
    const built = makeDb();
    db = built.db;
  });

  it("inserts user, match, prediction; computes points correctly", async () => {
    const now = Math.floor(Date.now() / 1000);

    await db.insert(schema.users).values({ id: "u1", email: "u1@x.com", role: "participant", createdAt: now });
    await db.insert(schema.teams).values([
      { id: 1, code: "BRA", namePt: "Brasil", nameEn: "Brazil", nameEs: "Brasil" },
      { id: 2, code: "ARG", namePt: "Argentina", nameEn: "Argentina", nameEs: "Argentina" },
    ]);
    await db.insert(schema.matches).values({
      id: 1, externalId: "ext1", stage: "group", groupCode: "A", round: 1,
      homeTeamId: 1, awayTeamId: 2, scheduledAt: now - 86400, status: "finished",
      homeScore: 2, awayScore: 1, finishedAt: now - 1000,
    });
    await db.insert(schema.predictions).values({
      userId: "u1", matchId: 1, homeScore: 2, awayScore: 1,
      createdAt: now, updatedAt: now,
    });

    const match = await db.select().from(schema.matches).where(eq(schema.matches.id, 1)).then((r) => r[0]);
    const pred = await db.select().from(schema.predictions).where(eq(schema.predictions.matchId, 1)).then((r) => r[0]);

    const result = scorePrediction(
      { homeScore: pred.homeScore, awayScore: pred.awayScore },
      { homeScore: match.homeScore!, awayScore: match.awayScore!, stage: match.stage, homeTeamId: 1, awayTeamId: 2 },
    );

    expect(result.points).toBe(3);
    expect(result.isExact).toBe(true);
  });

  it("handles user without prediction (zero points, no row)", async () => {
    const now = Math.floor(Date.now() / 1000);
    await db.insert(schema.users).values({ id: "u2", email: "u2@x.com", role: "participant", createdAt: now });
    await db.insert(schema.teams).values([
      { id: 10, code: "FRA", namePt: "França", nameEn: "France", nameEs: "Francia" },
      { id: 11, code: "GER", namePt: "Alemanha", nameEn: "Germany", nameEs: "Alemania" },
    ]);
    await db.insert(schema.matches).values({
      id: 2, externalId: "ext2", stage: "group", groupCode: "B", round: 1,
      homeTeamId: 10, awayTeamId: 11, scheduledAt: now - 86400, status: "finished",
      homeScore: 0, awayScore: 0,
    });

    const preds = await db.select().from(schema.predictions).where(eq(schema.predictions.userId, "u2"));
    expect(preds.length).toBe(0);
  });

  it("blocks duplicate prediction for same user/match (UNIQUE constraint)", async () => {
    const now = Math.floor(Date.now() / 1000);
    await db.insert(schema.users).values({ id: "u3", email: "u3@x.com", role: "participant", createdAt: now });
    await db.insert(schema.teams).values([
      { id: 20, code: "ESP", namePt: "Espanha", nameEn: "Spain", nameEs: "España" },
      { id: 21, code: "ITA", namePt: "Itália", nameEn: "Italy", nameEs: "Italia" },
    ]);
    await db.insert(schema.matches).values({
      id: 3, externalId: "ext3", stage: "group", groupCode: "C", round: 1,
      homeTeamId: 20, awayTeamId: 21, scheduledAt: now + 3600, status: "scheduled",
    });
    await db.insert(schema.predictions).values({
      userId: "u3", matchId: 3, homeScore: 1, awayScore: 0, createdAt: now, updatedAt: now,
    });

    expect(() =>
      db.insert(schema.predictions).values({
        userId: "u3", matchId: 3, homeScore: 2, awayScore: 0, createdAt: now, updatedAt: now,
      }).run(),
    ).toThrow();
  });
});
