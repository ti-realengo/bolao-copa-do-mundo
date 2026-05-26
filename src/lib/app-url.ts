import { headers } from "next/headers";

/**
 * Resolve the public base URL the user is currently visiting.
 *
 * Priority:
 *   1. Forwarded headers (host + protocol). This is what the browser is using
 *      RIGHT NOW, so it works for production, preview deployments, and local
 *      dev all the same — no env var needed.
 *   2. process.env.APP_URL (used by background jobs that have no incoming
 *      request, e.g. cron-triggered email sends).
 *   3. http://localhost:3000 (dev fallback).
 *
 * Use this everywhere the app composes a link the user will click later
 * (invite URLs, email links, OG card URLs, etc.). Never hard-code APP_URL.
 */
export async function getAppUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("host");
    if (host) {
      const proto =
        h.get("x-forwarded-proto") ??
        (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // headers() throws when called outside a request context (e.g., from a cron).
  }
  return process.env.APP_URL ?? "http://localhost:3000";
}
