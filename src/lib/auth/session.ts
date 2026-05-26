import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { generateSessionId } from "./tokens";

const SESSION_COOKIE = "bolao_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export async function createSession(userId: string, userAgent?: string, ipHash?: string | null) {
  const id = generateSessionId();
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  await db.insert(schema.sessions).values({
    id,
    userId,
    expiresAt,
    userAgent: userAgent ?? null,
    ipHash: ipHash ?? null,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return { id, expiresAt };
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const rows = await db
    .select({ session: schema.sessions, user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(eq(schema.sessions.id, sessionId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const now = Math.floor(Date.now() / 1000);
  if (row.session.expiresAt < now) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));
    return null;
  }
  if (row.user.deletedAt) return null;

  return { session: row.session, user: row.user };
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));
  }
  cookieStore.delete(SESSION_COOKIE);
}
