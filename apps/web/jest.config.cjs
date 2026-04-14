/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    // shadcn / third-party-style UI wrappers (no product logic; excluded per checklist)
    "!src/components/ui/**",
  ],
  // `page.tsx` / `layout.tsx` / `hooks/**` included; only shadcn-style `ui/**` excluded (checklist §6).
  coverageThreshold: {
    global: {
      lines: 80,
      statements: 77,
      functions: 69,
      branches: 66,
    },
    /** Heavy-feature gates (posts / offers / Places); tune per file as coverage improves */
    "**/lib/offers/postLocationDisplay.ts": {
      statements: 100,
      lines: 100,
      functions: 100,
      branches: 83,
    },
    "**/lib/places/client.ts": {
      statements: 100,
      lines: 100,
      functions: 100,
      branches: 82,
    },
    "**/components/offers/LocationPicker.tsx": {
      statements: 77,
      lines: 77,
      branches: 67,
      functions: 77,
    },
    "**/components/offers/SubmitOfferForm.tsx": {
      statements: 81,
      lines: 81,
      branches: 77,
      functions: 75,
    },
    "**/components/offers/PostDetail.tsx": {
      statements: 78,
      lines: 78,
      branches: 71,
      functions: 68,
    },
    "**/components/offers/Article.tsx": {
      statements: 86,
      lines: 86,
      branches: 70,
      functions: 88,
    },
    "**/app/search/SearchPageClient.tsx": {
      statements: 82,
      lines: 82,
      branches: 74,
      functions: 72,
    },
  },
  testPathIgnorePatterns: ["<rootDir>/tests/e2e/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

module.exports = createJestConfig(customJestConfig);
