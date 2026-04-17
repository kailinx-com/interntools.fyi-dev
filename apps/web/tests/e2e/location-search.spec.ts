import { expect, test } from "@playwright/test";

function placeDetailsBody(displayName: string, formattedAddress: string) {
  return JSON.stringify({
    name: "places/mock",
    displayName: { text: displayName },
    formattedAddress,
    googleMapsUri: "https://www.google.com/maps/search/?api=1&query=mocked",
    photos: [],
    addressComponents: [
      {
        longText: "E2E State",
        shortText: "E2E State",
        types: ["administrative_area_level_1", "political"],
      },
    ],
  });
}

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

      if (url.includes("places:searchText") && method === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            places: [
              {
                id: "places/ChIJ_custom_free",
                displayName: { text: "Custom Free Text" },
                formattedAddress: "1 Custom Rd, USA",
                photos: [],
              },
            ],
          }),
        });
        return;
      }

      const detailsMatch = url.match(/places\.googleapis\.com\/v1\/places\/([^/?]+)/);
      if (detailsMatch && method === "GET" && !url.includes("/media")) {
        const rawId = decodeURIComponent(detailsMatch[1]);
        const id = rawId.startsWith("places/") ? rawId.slice("places/".length) : rawId;
        if (id === "ChIJ_e2e_test") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: placeDetailsBody("E2E City", "E2E City, E2E State, USA"),
          });
          return;
        }
        if (id === "ChIJ_custom_free") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: placeDetailsBody("Custom Free Text", "1 Custom Rd, USA"),
          });
          return;
        }
      }

      await route.continue();
    });
  });

  test("picking an autocomplete suggestion opens details loaded from Places Details API", async ({
    page,
  }) => {
    await page.goto("/search");

    await expect(page.getByRole("heading", { name: /search by location/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByTestId("place-search-input").fill("E2");
    await expect(page.getByTestId("location-suggestion")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("location-suggestion").click();

    await expect(page).toHaveURL(/\/details\/ChIJ_e2e_test/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "E2E City" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("E2E City, E2E State, USA")).toBeVisible();
    await expect(page.getByText(/posts for this area/i)).toBeVisible();
    const mapsLink = page.getByRole("link", { name: /open in google maps/i });
    await expect(mapsLink).toBeVisible();
    await expect(mapsLink).toHaveAttribute("href", /google\.com\/maps/);
  });

  test("Search button resolves typed text via searchText then loads Places Details", async ({
    page,
  }) => {
    await page.goto("/search");
    await page.getByTestId("place-search-input").fill("Custom Free Text");
    await page.getByRole("button", { name: /^search$/i }).click();
    await expect(page).toHaveURL(/\/details\/ChIJ_custom_free/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Custom Free Text" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("1 Custom Rd, USA")).toBeVisible();
  });

  test("search page shows location guidance", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByText(/Pick a suggestion/i)).toBeVisible({ timeout: 30_000 });
  });

  test("pre-fills the input from ?criteria= and survives refresh", async ({ page }) => {
    const criteria = "Persisted City ST USA";
    await page.goto(`/search?${new URLSearchParams({ criteria }).toString()}`);

    await expect(page.getByRole("heading", { name: /search by location/i })).toBeVisible({
      timeout: 30_000,
    });
    const input = page.getByTestId("place-search-input");
    await expect(input).toHaveValue(criteria, { timeout: 15_000 });

    await page.reload();
    await expect(input).toHaveValue(criteria, { timeout: 15_000 });
  });

  test("browser back restores the search field from the URL", async ({ page }) => {
    await page.goto("/search");

    await expect(page.getByRole("heading", { name: /search by location/i })).toBeVisible({
      timeout: 30_000,
    });

    const label = "Custom Free Text";
    const input = page.getByTestId("place-search-input");
    await input.fill(label);
    await expect(page).toHaveURL(/[?&]criteria=/, { timeout: 5000 });

    await page.getByRole("button", { name: /^search$/i }).click();

    await expect(page).toHaveURL(/\/details\/ChIJ_custom_free/, { timeout: 15_000 });

    await page.goBack();

    await expect(page).toHaveURL(/\/search.*[?&]criteria=/, { timeout: 15_000 });
    await expect(input).toHaveValue(label, {
      timeout: 15_000,
    });
  });
});
