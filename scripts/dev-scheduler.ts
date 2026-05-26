const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const SECRET = process.env.CRON_SECRET ?? process.env.SESSION_SECRET ?? "";

if (!SECRET) {
  console.error("SESSION_SECRET ou CRON_SECRET necessário");
  process.exit(1);
}

interface Job {
  name: string;
  path: string;
  intervalMs: number;
  lastRun: number;
}

const JOBS: Job[] = [
  { name: "sync-results", path: "/api/cron/sync-results", intervalMs: 5 * 60 * 1000, lastRun: 0 },
  { name: "reminders", path: "/api/cron/reminders", intervalMs: 60 * 60 * 1000, lastRun: 0 },
  { name: "recap", path: "/api/cron/recap", intervalMs: 60 * 60 * 1000, lastRun: 0 },
];

async function runJob(job: Job) {
  const start = Date.now();
  try {
    const res = await fetch(`${APP_URL}${job.path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}` },
    });
    const body = await res.text();
    const ms = Date.now() - start;
    if (res.ok) {
      console.log(`[${new Date().toISOString()}] ${job.name} (${ms}ms): ${body.slice(0, 200)}`);
    } else {
      console.warn(`[${new Date().toISOString()}] ${job.name} HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
  } catch (e) {
    console.warn(`[${new Date().toISOString()}] ${job.name} ERROR: ${(e as Error).message}`);
  }
  job.lastRun = Date.now();
}

async function tick() {
  const now = Date.now();
  for (const job of JOBS) {
    if (now - job.lastRun >= job.intervalMs) {
      runJob(job);
    }
  }
}

console.log(`Dev scheduler iniciado, alvo: ${APP_URL}`);
console.log(`Jobs: ${JOBS.map((j) => `${j.name}@${j.intervalMs / 60000}min`).join(", ")}`);
console.log("Aguardando 5s para o servidor subir antes do primeiro tick...\n");

setTimeout(() => {
  tick();
  setInterval(tick, 30 * 1000);
}, 5000);
