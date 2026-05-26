import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  try {
    const result = await db.select({ c: sql<number>`count(*)` }).from(schema.users).limit(1);
    const userCount = Number(result[0]?.c ?? 0);
    return NextResponse.json({
      ok: true,
      version: process.env.APP_VERSION ?? "dev",
      runtime: process.env.NEXT_RUNTIME ?? "nodejs",
      dbDriver: process.env.DB_DRIVER ?? "better-sqlite3",
      userCount,
      latencyMs: Date.now() - start,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}
