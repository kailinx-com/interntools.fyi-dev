import { expect, test } from "@playwright/test";

/**
 * Direct API checks against the Spring Boot server (same origin as webServer in playwright.config).
 * Complements UI E2E when FE and BE ship on different cadences.
 */
const apiBase = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://127.0.0.1:8080/api";

test.describe("API contract smoke", () => {
  test("GET /posts returns a Spring Data page with content array", async ({ request }) => {
    const res = await request.get(`${apiBase}/posts?page=0&size=5`);
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as {
      content: unknown;
      totalElements?: number;
    };
    expect(Array.isArray(body.content)).toBe(true);
  });
});
