import { NextRequest } from "next/server";

export function isCronAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? process.env.SESSION_SECRET}`;
  return auth === expected;
}
