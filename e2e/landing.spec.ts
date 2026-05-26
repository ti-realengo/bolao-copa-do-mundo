import { test, expect } from "@playwright/test";

test.describe("landing", () => {
  test("renders hero with CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/sem planilha/i);
    await expect(page.getByRole("link", { name: /entrar/i }).first()).toBeVisible();
  });

  test("links to /regras", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /como funciona/i }).first().click();
    await expect(page).toHaveURL(/\/regras/);
  });
});
