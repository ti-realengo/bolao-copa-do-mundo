import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit/log";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const userId = session.user.id;

  const [predictions, specials, leagueMemberships, achievements, snapshot, comments] = await Promise.all([
    db.select().from(schema.predictions).where(eq(schema.predictions.userId, userId)),
    db.select().from(schema.specialPredictions).where(eq(schema.specialPredictions.userId, userId)),
    db.select().from(schema.leagueMembers).where(eq(schema.leagueMembers.userId, userId)),
    db.select().from(schema.achievements).where(eq(schema.achievements.userId, userId)),
    db.select().from(schema.rankingsSnapshot).where(eq(schema.rankingsSnapshot.userId, userId)),
    db.select().from(schema.matchComments).where(eq(schema.matchComments.userId, userId)),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      phone: session.user.phone,
      role: session.user.role,
      consentLgpd: !!session.user.consentLgpd,
      consentLgpdAt: session.user.consentLgpdAt ? new Date(session.user.consentLgpdAt * 1000).toISOString() : null,
      createdAt: new Date(session.user.createdAt * 1000).toISOString(),
      lastLoginAt: session.user.lastLoginAt ? new Date(session.user.lastLoginAt * 1000).toISOString() : null,
    },
    predictions,
    specialPredictions: specials,
    leagueMemberships,
    achievements,
    rankingsSnapshot: snapshot,
    comments,
  };

  await logAudit(userId, "user.data.export");

  const filename = `bolao-${userId}-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
