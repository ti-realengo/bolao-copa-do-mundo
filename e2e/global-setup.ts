import { resetDb } from "./fixtures/seed";

async function globalSetup() {
  resetDb();
  console.log("[e2e] DB seeded");
}

export default globalSetup;
