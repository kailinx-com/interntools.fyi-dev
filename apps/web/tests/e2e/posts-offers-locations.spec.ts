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
    const titleLabel = page.getByLabel(/title/i);
    const loginField = page.getByLabel(/username or email/i);
    // Wait for either the authenticated form or the login redirect to settle,
    // avoiding a race where toHaveURL resolves during the auth-loading spinner.
    await expect(titleLabel.or(loginField)).toBeVisible({ timeout: 15_000 });
    if (await titleLabel.isVisible()) {
      await expect(page.getByRole("button", { name: /^comparison$/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /^acceptance$/i })).toBeVisible();
    }
  });
});
