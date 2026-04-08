import { defineConfig, devices } from "@playwright/test";

/** Run `E2E_FULL=1 pnpm test:e2e` (or set `CI`) to add Firefox, WebKit, and mobile route smoke. */
const fullBrowserMatrix =
  process.env.E2E_FULL === "1" ||
  process.env.CI === "true" ||
  process.env.CI === "1";

const smokeAndApiSpecs = ["**/routes-smoke.spec.ts", "**/api-contract.spec.ts"];

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 1,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command:
        "cd ../.. && mvn -f apps/api/pom.xml -DskipTests spring-boot:run -Dspring-boot.run.profiles=e2e",
      url: "http://127.0.0.1:8080/api/posts",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: "npm run dev",
      env: {
        ...process.env,
        NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:8080/api",
      },
      url: "http://127.0.0.1:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    ...(fullBrowserMatrix
      ? [
          {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] },
            testMatch: smokeAndApiSpecs,
          },
          {
            name: "webkit",
            use: { ...devices["Desktop Safari"] },
            testMatch: smokeAndApiSpecs,
          },
          {
            name: "mobile-chrome",
            use: { ...devices["Pixel 5"] },
            testMatch: "**/routes-smoke.spec.ts",
          },
        ]
      : []),
  ],
});
