import { test, expect } from "@playwright/test";
import {
  resetDb,
  seedAllowedDomain,
  seedUserWithPassword,
  countUsers,
  getUserRole,
  isDomainAllowed,
} from "./fixtures/seed";

test.describe("signup", () => {
  test.beforeEach(async () => {
    resetDb();
  });

  test("first signup becomes superadmin and adds its domain to allowlist", async ({ page }) => {
    expect(countUsers()).toBe(0);

    await page.goto("/cadastro");
    await page.getByPlaceholder(/seu nome/i).fill("Founder");
    await page.getByPlaceholder(/seu\.email/i).fill("founder@acme.test");
    await page.getByPlaceholder(/senha \(/i).fill("senha-segura-12chars");
    await page.getByPlaceholder(/confirme/i).fill("senha-segura-12chars");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /criar conta/i }).click();

    await page.waitForURL(/\/admin/, { timeout: 25000 });

    expect(getUserRole("founder@acme.test")).toBe("superadmin");
    expect(isDomainAllowed("acme.test")).toBe(true);
  });

  test("signup with allowed domain becomes participant", async ({ page }) => {
    await seedUserWithPassword("admin@acme.test", "Admin", "abcdefghijkl", "superadmin");
    seedAllowedDomain("acme.test");

    await page.goto("/cadastro");
    await page.getByPlaceholder(/seu nome/i).fill("Bob");
    await page.getByPlaceholder(/seu\.email/i).fill("bob@acme.test");
    await page.getByPlaceholder(/senha \(/i).fill("senha-segura-12chars");
    await page.getByPlaceholder(/confirme/i).fill("senha-segura-12chars");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /criar conta/i }).click();

    await page.waitForURL(/\/home/, { timeout: 25000 });
    expect(getUserRole("bob@acme.test")).toBe("participant");
  });

  test("signup with non-allowed domain is rejected", async ({ page }) => {
    await seedUserWithPassword("admin@acme.test", "Admin", "abcdefghijkl", "superadmin");
    seedAllowedDomain("acme.test");

    await page.goto("/cadastro");
    await page.getByPlaceholder(/seu nome/i).fill("Eve");
    await page.getByPlaceholder(/seu\.email/i).fill("eve@gmail.com");
    await page.getByPlaceholder(/senha \(/i).fill("senha-segura-12chars");
    await page.getByPlaceholder(/confirme/i).fill("senha-segura-12chars");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /criar conta/i }).click();

    await expect(page.getByText(/domínio do email não está autorizado/i)).toBeVisible({ timeout: 5000 });
    expect(getUserRole("eve@gmail.com")).toBeNull();
  });

  test("signup with mismatched password confirmation shows inline error", async ({ page }) => {
    await page.goto("/cadastro");
    await page.getByPlaceholder(/seu nome/i).fill("Test");
    await page.getByPlaceholder(/seu\.email/i).fill("test@e2e.test");
    await page.getByPlaceholder(/senha \(/i).fill("senha-segura-12chars");
    await page.getByPlaceholder(/confirme/i).fill("outra-senha-12chars-x");

    await expect(page.getByText(/senhas não conferem/i)).toBeVisible();
  });
});
