import { test, expect } from "@playwright/test";
import { seedUser } from "./fixtures/seed";
import { makeSessionFor } from "./fixtures/auth";

test.describe("authenticated app", () => {
  test("home shows next match and user name", async ({ page, context }) => {
    const user = seedUser(`alice-${Date.now()}@e2e.test`, "Alice E2E");
    const sessionId = makeSessionFor(user.id);
    await context.addCookies([{
      name: "bolao_session",
      value: sessionId,
      url: page.url() === "about:blank" ? "http://localhost:3100" : page.url(),
      httpOnly: true,
      sameSite: "Lax",
    }]);

    await page.goto("/home");
    await expect(page.getByRole("heading", { name: /Olá, Alice/i })).toBeVisible();
    await expect(page.getByText(/Próximo jogo/i)).toBeVisible();
  });

  test("can submit a prediction with auto-save", async ({ page, context }) => {
    const user = seedUser(`bob-${Date.now()}@e2e.test`, "Bob E2E");
    const sessionId = makeSessionFor(user.id);
    await context.addCookies([{
      name: "bolao_session",
      value: sessionId,
      url: "http://localhost:3100",
      httpOnly: true,
      sameSite: "Lax",
    }]);

    await page.goto("/jogos");
    const homeInputs = page.locator('input[type="number"]').nth(0);
    const awayInputs = page.locator('input[type="number"]').nth(1);
    await homeInputs.fill("2");
    await awayInputs.fill("1");

    await expect(page.getByText(/Salvo/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("ranking page renders even with no scored matches", async ({ page, context }) => {
    const user = seedUser(`carol-${Date.now()}@e2e.test`, "Carol E2E");
    const sessionId = makeSessionFor(user.id);
    await context.addCookies([{
      name: "bolao_session",
      value: sessionId,
      url: "http://localhost:3100",
      httpOnly: true,
      sameSite: "Lax",
    }]);

    await page.goto("/ranking");
    await expect(page.getByRole("heading", { name: /ranking geral/i })).toBeVisible();
  });

  test("can create a private league", async ({ page, context }) => {
    const user = seedUser(`dan-${Date.now()}@e2e.test`, "Dan E2E");
    const sessionId = makeSessionFor(user.id);
    await context.addCookies([{
      name: "bolao_session",
      value: sessionId,
      url: "http://localhost:3100",
      httpOnly: true,
      sameSite: "Lax",
    }]);

    await page.goto("/grupos/novo");
    await page.locator('input:not([type="hidden"]):not([type="checkbox"])').first().fill("Turma do Dan");
    await page.getByRole("button", { name: /criar grupo/i }).click();
    await expect(page).toHaveURL(/\/grupos\/[^/]+$/);
    await expect(page.getByRole("heading", { name: "Turma do Dan" })).toBeVisible();
  });
});
