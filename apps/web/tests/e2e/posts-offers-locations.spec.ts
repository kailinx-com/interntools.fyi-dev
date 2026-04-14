import { expect, test } from "@playwright/test";

test.describe("posts, offers, and places surfaces", () => {
  test("search page shows the places search form", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByRole("heading", { name: /search by location/i })).toBeVisible();
    await expect(page.getByTestId("place-search-input")).toBeVisible();
    await expect(page.getByRole("button", { name: /^search$/i })).toBeVisible();
  });

  test("submit offer page shows comparison vs acceptance affordances when authenticated", async ({
    page,
  }) => {
    await page.goto("/offers/submit");
    await expect(page).toHaveURL(/\/offers\/submit$|\/login/);
    if (/\/offers\/submit$/.test(page.url())) {
      await expect(page.getByRole("button", { name: /^comparison$/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /^acceptance$/i })).toBeVisible();
      await expect(page.getByLabel(/title/i)).toBeVisible();
    }
  });
});
