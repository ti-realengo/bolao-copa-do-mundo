import { test, expect } from "@playwright/test";
import { resetDb, seedUserWithPassword } from "./fixtures/seed";

test.describe("login", () => {
  test.beforeEach(async () => {
    resetDb();
  });

  test("rejects invalid credentials", async ({ page }) => {
    await seedUserWithPassword("alice@e2e.test", "Alice", "senha-correta-1234");

    await page.goto("/login");
    await page.getByPlaceholder(/email/i).fill("alice@e2e.test");
    await page.getByPlaceholder(/senha/i).fill("senha-errada-1234");
    await page.getByRole("button", { name: /entrar/i }).click();

    await expect(page.getByText(/email ou senha inválidos/i)).toBeVisible({ timeout: 5000 });
  });

  test("logs in participant and redirects to /home", async ({ page }) => {
    await seedUserWithPassword("alice@e2e.test", "Alice", "senha-correta-1234", "participant");

    await page.goto("/login");
    await page.getByPlaceholder(/email/i).fill("alice@e2e.test");
    await page.getByPlaceholder(/senha/i).fill("senha-correta-1234");
    await page.getByRole("button", { name: /entrar/i }).click();

    await page.waitForURL(/\/home/, { timeout: 20000 });
  });

  test("logs in superadmin and redirects to /admin", async ({ page }) => {
    await seedUserWithPassword("admin@e2e.test", "Admin", "senha-correta-1234", "superadmin");

    await page.goto("/login");
    await page.getByPlaceholder(/email/i).fill("admin@e2e.test");
    await page.getByPlaceholder(/senha/i).fill("senha-correta-1234");
    await page.getByRole("button", { name: /entrar/i }).click();

    await page.waitForURL(/\/admin/, { timeout: 20000 });
  });

  test("shows link to /cadastro", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: /cadastrar/i })).toBeVisible();
  });
});
