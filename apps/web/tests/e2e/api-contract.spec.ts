import { expect, test } from "@playwright/test";

/** Spring API smoke (override with PLAYWRIGHT_API_BASE_URL). */
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

  test("GET /posts/related-location returns a JSON array", async ({ request }) => {
    const res = await request.get(`${apiBase}/posts/related-location?text=Seattle`);
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as unknown;
    expect(Array.isArray(body)).toBe(true);
  });

  test("GET /offers/by-office-location returns a JSON array", async ({ request }) => {
    const res = await request.get(`${apiBase}/offers/by-office-location?tokens=Seattle&tokens=WA`);
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as unknown;
    expect(Array.isArray(body)).toBe(true);
  });

  test("GET /comparisons/by-office-location returns a JSON array", async ({ request }) => {
    const res = await request.get(`${apiBase}/comparisons/by-office-location?tokens=Seattle`);
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as unknown;
    expect(Array.isArray(body)).toBe(true);
  });
});
