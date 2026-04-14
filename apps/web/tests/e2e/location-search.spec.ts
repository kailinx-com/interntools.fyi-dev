import { expect, test } from "@playwright/test";

/**
 * Google Places is mocked so CI does not need a real API key.
 * App uses places:autocomplete only; details use description text (no Places Details API).
 * NEXT_PUBLIC_GOOGLE_PLACES_API_KEY must be non-empty (see playwright.config webServer env).
 */
test.describe("location search (Google Places mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("https://places.googleapis.com/**", async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (url.includes("places:autocomplete") && method === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            suggestions: [
              {
                placePrediction: {
                  placeId: "places/ChIJ_e2e_test",
                  text: { text: "E2E City, E2E State, USA" },
                },
              },
            ],
          }),
        });
        return;
      }

      await route.continue();
    });
  });

  test("picking an autocomplete suggestion opens details with description text and Maps search link", async ({
    page,
  }) => {
    await page.goto("/search");

    await expect(page.getByRole("heading", { name: /search by location/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByTestId("place-search-input").fill("E2");
    await expect(page.getByTestId("location-suggestion")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("location-suggestion").click();

    await expect(page).toHaveURL(/\/details\//, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "E2E City" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/posts for this area/i)).toBeVisible();
    const mapsLink = page.getByRole("link", { name: /open in google maps/i });
    await expect(mapsLink).toBeVisible();
    await expect(mapsLink).toHaveAttribute("href", /google\.com\/maps\/search/);
  });

  test("Search button navigates to details using typed text without autocomplete", async ({ page }) => {
    await page.goto("/search");
    await page.getByTestId("place-search-input").fill("Custom Free Text");
    await page.getByRole("button", { name: /^search$/i }).click();
    await expect(page).toHaveURL(/\/details\//, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Custom Free Text" })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("search page shows autocomplete guidance", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByText(/autocomplete/i)).toBeVisible({ timeout: 30_000 });
  });
});
