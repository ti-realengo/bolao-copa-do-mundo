interface CronEnv {
  APP_URL?: string;
  CRON_SECRET?: string;
  SESSION_SECRET?: string;
}

interface ScheduledController {
  cron: string;
  scheduledTime: number;
}

const ROUTING: Record<string, string> = {
  "*/5 * * * *": "/api/cron/sync-results",
  "0 * * * *": "/api/cron/reminders",
  "0 23 * * *": "/api/cron/recap",
};

export async function handleScheduled(controller: ScheduledController, env: CronEnv): Promise<void> {
  const path = ROUTING[controller.cron];
  if (!path) {
    console.warn(`[scheduled] no route for cron ${controller.cron}`);
    return;
  }
  const url = `${env.APP_URL ?? ""}${path}`;
  const secret = env.CRON_SECRET ?? env.SESSION_SECRET;
  if (!secret) {
    console.error("[scheduled] CRON_SECRET/SESSION_SECRET ausente");
    return;
  }

  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
    });
    const body = await res.text();
    const ms = Date.now() - start;
    console.log(`[scheduled] ${controller.cron} → ${path} ${res.status} (${ms}ms): ${body.slice(0, 200)}`);
  } catch (e) {
    console.error(`[scheduled] ${controller.cron} ERROR:`, (e as Error).message);
  }
}
