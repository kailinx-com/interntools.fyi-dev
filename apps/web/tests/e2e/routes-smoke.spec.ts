import { expect, test } from "@playwright/test";

/** Public routes render without 5xx (playwright webServer + API). */
test.describe("public route smoke", () => {
  test("calculator and planner shells load", async ({ page }) => {
    await page.goto("/calculator");
    await expect(page.getByText(/Payroll estimation|calculator/i).first()).toBeVisible({ timeout: 30_000 });

    await page.goto("/calculator/planner");
    await expect(
      page.getByText(/Sign in to use the budget planner|No saved calculator configs/i).first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("search page shell loads", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByRole("heading", { name: /search by location/i })).toBeVisible({ timeout: 30_000 });
  });

  test("legal and settings pages load", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: /privacy policy/i })).toBeVisible({ timeout: 30_000 });

    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: /terms of service/i })).toBeVisible({ timeout: 30_000 });

    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: /^settings$/i })).toBeVisible({ timeout: 30_000 });
  });
});
