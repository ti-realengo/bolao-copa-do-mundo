import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/fixtures/**", "**/global-setup.ts"],
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  globalSetup: "./e2e/global-setup.ts",
  reporter: process.env.CI ? "list" : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "pt-BR",
    extraHTTPHeaders: { "Accept-Language": "pt-BR,pt;q=0.9" },
  },
  projects: [
    { name: "chromium", use: devices["Desktop Chrome"] },
  ],
  webServer: {
    command: `cross-env DATABASE_URL=./data/e2e.db PORT=${PORT} pnpm dev`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
    timeout: 90_000,
  },
});
