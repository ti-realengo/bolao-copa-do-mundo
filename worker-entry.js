// Worker entrypoint that wraps the OpenNext-generated bundle and adds
// the scheduled() handler. Only used in production deploy.
//
// Build sequence:
//   1) pnpm dlx @opennextjs/cloudflare build  → produces .open-next/worker.js
//   2) wrangler deploy                         → bundles this file as main
//
// Important: this file is JS (not TS) so that we can reference the
// generated .open-next/worker.js without breaking typecheck before the
// build has produced it.

import nextWorker from "./.open-next/worker.js";

const ROUTING = {
  "*/5 * * * *": "/api/cron/sync-results",
  "0 * * * *": "/api/cron/reminders",
  "0 23 * * *": "/api/cron/recap",
};

async function runScheduled(controller, env) {
  const path = ROUTING[controller.cron];
  if (!path) {
    console.warn(`[scheduled] no route for cron ${controller.cron}`);
    return;
  }
  const url = `${env.APP_URL ?? ""}${path}`;
  const secret = env.CRON_SECRET ?? env.SESSION_SECRET;
  if (!secret) {
    console.error("[scheduled] CRON_SECRET/SESSION_SECRET missing");
    return;
  }
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
    });
    const body = await res.text();
    console.log(`[scheduled] ${controller.cron} → ${path} ${res.status} (${Date.now() - start}ms): ${body.slice(0, 200)}`);
  } catch (e) {
    console.error(`[scheduled] ${controller.cron} ERROR:`, e?.message ?? e);
  }
}

export default {
  fetch(req, env, ctx) {
    return nextWorker.fetch(req, env, ctx);
  },
  scheduled(event, env, ctx) {
    ctx.waitUntil(runScheduled(event, env));
  },
};
