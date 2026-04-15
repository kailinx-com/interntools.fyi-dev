import { expect, test, type Page } from "@playwright/test";

function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

async function registerAccount(
  page: Page,
  opts: { username: string; email: string; password: string },
) {
  await page.goto("/signup");
  await page.getByLabel("Username").fill(opts.username);
  await page.getByLabel("First name").fill("E2E");
  await page.getByLabel("Last name").fill("User");
  await page.getByLabel(/^Email$/i).fill(opts.email);
  await page.locator("#password").fill(opts.password);
  await page.locator("#confirm-password").fill(opts.password);
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/login$/, { timeout: 30_000 });
}

async function login(page: Page, opts: { identifier: string; password: string }) {
  await page.goto("/login");
  await page.getByLabel(/username or email/i).fill(opts.identifier);
  await page.getByLabel(/^Password$/i).fill(opts.password);
  await page.getByRole("button", { name: /^login$/i }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
}

async function logoutFromNavbar(page: Page, username: string) {
  await page.goto("/");
  await page.getByRole("button", { name: new RegExp(`Hi, ${username}`) }).click();
  await page.getByRole("menuitem", { name: /log out/i }).click();
  await expect(page.getByRole("link", { name: /log in/i })).toBeVisible({ timeout: 10_000 });
}

test.describe("critical journeys", () => {
  test("home and auth entry points render", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: /log in|login/i })).toBeVisible();

    await page.goto("/signup");
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("offers feed route is reachable", async ({ page }) => {
    await page.goto("/offers");
    await expect(page).toHaveURL(/\/offers$/);
  });

  test("account route redirects unauthenticated user", async ({ page }) => {
    await page.goto("/me");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login and signup forms expose required fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/username or email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();

    await page.goto("/signup");
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/^email$/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
  });

  test("offers submit page is reachable and shows form controls", async ({ page }) => {
    await page.goto("/offers/submit");
    const titleLabel = page.getByLabel(/title/i);
    const loginField = page.getByLabel(/username or email/i);
    // Wait for either the authenticated form or the login redirect to settle,
    // avoiding a race where toHaveURL resolves during the auth-loading spinner.
    await expect(titleLabel.or(loginField)).toBeVisible({ timeout: 15_000 });
    if (await titleLabel.isVisible()) {
      await expect(page.getByRole("button", { name: /publish/i })).toBeVisible();
    } else {
      await expect(loginField).toBeVisible();
    }
  });

  test("signup -> login -> logout lifecycle", async ({ page }) => {
    const suffix = uniqueSuffix();
    const username = `e2e_${suffix}`;
    const email = `e2e_${suffix}@example.com`;
    const password = "password123";

    await registerAccount(page, { username, email, password });
    await login(page, { identifier: username, password });
    await expect(page.getByRole("button", { name: new RegExp(`Hi, ${username}`) })).toBeVisible({
      timeout: 15_000,
    });

    await logoutFromNavbar(page, username);
  });

  test("signup then login with email identifier succeeds", async ({ page }) => {
    const suffix = uniqueSuffix();
    const username = `e2e_email_${suffix}`;
    const email = `e2e_email_${suffix}@example.com`;
    const password = "password123";

    await registerAccount(page, { username, email, password });
    await login(page, { identifier: email, password });
    await expect(page.getByRole("button", { name: new RegExp(`Hi, ${username}`) })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("create post -> view post -> bookmark and unbookmark", async ({ page }) => {
    const suffix = uniqueSuffix();
    const username = `e2e_post_${suffix}`;
    const email = `e2e_post_${suffix}@example.com`;
    const password = "password123";

    await registerAccount(page, { username, email, password });
    await login(page, { identifier: username, password });

    await page.goto("/offers/submit");
    await expect(page).toHaveURL(/\/offers\/submit$/);
    await page.getByLabel(/title/i).fill(`E2E offer ${suffix}`);
    await page.getByLabel(/^Company$/i).fill("Acme Corp");
    await page.getByLabel(/^Role$/i).fill("SWE Intern");
    await page.getByLabel(/^Compensation$/i).fill("$8,000/mo");
    await page.getByRole("button", { name: /^publish$/i }).click();

    await expect(page).toHaveURL(/\/offers\/\d+$/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: new RegExp(`E2E offer ${suffix}`) })).toBeVisible({
      timeout: 15_000,
    });

    const bookmarkBtn = page.getByTitle(/^Bookmark$/);
    await bookmarkBtn.click();
    await expect(page.getByTitle(/^Remove bookmark$/)).toBeVisible({ timeout: 10_000 });
    await page.getByTitle(/^Remove bookmark$/).click();
    await expect(page.getByTitle(/^Bookmark$/)).toBeVisible({ timeout: 10_000 });
  });

  test("compare offers: save to account and publish opens submit", async ({ page }) => {
    const suffix = uniqueSuffix();
    const username = `e2e_cmp_${suffix}`;
    const email = `e2e_cmp_${suffix}@example.com`;
    const password = "password123";

    await registerAccount(page, { username, email, password });
    await login(page, { identifier: username, password });

    await page.goto("/offers/compare");
    await expect(page.getByRole("heading", { name: /compare offers/i })).toBeVisible();

    const companyInputs = page.getByPlaceholder("Company");
    await companyInputs.nth(0).fill("Alpha Inc");
    await companyInputs.nth(1).fill("Beta LLC");

    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByText(/comparison saved to your account/i)).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("button", { name: /publish/i }).click();
    await expect(page).toHaveURL(/\/offers\/submit\?from=compare$/, { timeout: 20_000 });
    await expect(page.getByText(/comparison preview/i)).toBeVisible();
  });

  test("saved comparison: /me → open comparison → compare hydrates columns", async ({ page }) => {
    const suffix = uniqueSuffix();
    const username = `e2e_cmp_me_${suffix}`;
    const email = `e2e_cmp_me_${suffix}@example.com`;
    const password = "password123";

    await registerAccount(page, { username, email, password });
    await login(page, { identifier: username, password });

    await page.goto("/offers/compare");
    await expect(page.getByRole("heading", { name: /compare offers/i })).toBeVisible();

    const companyInputs = page.getByPlaceholder("Company");
    await companyInputs.nth(0).fill("Hydrate Co A");
    await companyInputs.nth(1).fill("Hydrate Co B");

    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByText(/comparison saved to your account/i)).toBeVisible({
      timeout: 30_000,
    });

    await page.goto("/me");
    await expect(page.getByRole("heading", { name: /my account/i })).toBeVisible({ timeout: 20_000 });
    // Wait for the dashboard data to finish loading (heading only renders once Promise.all settles)
    await expect(page.getByRole("heading", { name: /saved comparisons/i })).toBeVisible({ timeout: 30_000 });

    await page.getByRole("link", { name: /open comparison/i }).click();
    await expect(page).toHaveURL(/\/offers\/compare\?comparison=\d+/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /compare offers/i })).toBeVisible();

    const loadingRegion = page.getByRole("status", { name: /loading saved comparison/i });
    await expect(loadingRegion).toBeHidden({ timeout: 30_000 });

    await expect(page.getByPlaceholder("Company").nth(0)).toHaveValue("Hydrate Co A", {
      timeout: 20_000,
    });
    await expect(page.getByPlaceholder("Company").nth(1)).toHaveValue("Hydrate Co B");
  });

  test("saved offer: detail → post an update → submit prefilled from saved offer", async ({
    page,
  }) => {
    const suffix = uniqueSuffix();
    const username = `e2e_saved_offer_${suffix}`;
    const email = `e2e_saved_offer_${suffix}@example.com`;
    const password = "password123";

    await registerAccount(page, { username, email, password });
    await login(page, { identifier: username, password });

    await page.goto("/offers/submit");
    await expect(page).toHaveURL(/\/offers\/submit$/);
    await page.getByLabel(/title/i).fill(`Prefill check ${suffix}`);
    await page.getByLabel(/^Company$/i).fill("Prefill Corp");
    await page.getByLabel(/^Role$/i).fill("Intern");
    await page.getByLabel(/^Compensation$/i).fill("$7,500/mo");
    await page.getByRole("button", { name: /^publish$/i }).click();

    await expect(page).toHaveURL(/\/offers\/\d+$/, { timeout: 30_000 });

    await page.goto("/me");
    await expect(page.getByRole("heading", { name: /my account/i })).toBeVisible({ timeout: 20_000 });
    // Wait for the dashboard data to finish loading (heading only renders once Promise.all settles)
    await expect(page.getByRole("heading", { name: /saved offers/i })).toBeVisible({ timeout: 30_000 });
    await page.getByTitle("View saved offer").first().click();

    await expect(page).toHaveURL(/\/offers\/saved\/\d+/, { timeout: 15_000 });
    await expect(page.getByText("Prefill Corp — Intern")).toBeVisible({ timeout: 15_000 });

    await page.locator('a[href^="/offers/submit?offerId="]').click();

    await expect(page.getByText(/prefilled from saved offer/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByLabel(/^Company$/i)).toHaveValue("Prefill Corp", { timeout: 15_000 });
  });

  test("/me profile: validation for password change without current password", async ({ page }) => {
    const suffix = uniqueSuffix();
    const username = `e2e_me_${suffix}`;
    const email = `e2e_me_${suffix}@example.com`;
    const password = "password123";

    await registerAccount(page, { username, email, password });
    await login(page, { identifier: username, password });

    await page.goto("/me");
    await expect(page.getByRole("heading", { name: /my account/i })).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /^edit$/i }).click();

    await page.locator("#new-password").fill("newpassword12");
    await page.locator("#confirm-password").fill("newpassword12");
    await page.getByRole("button", { name: /save changes/i }).click();

    await expect(page.getByText(/current password is required to set a new password/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
