process.env.NEXT_PUBLIC_API_BASE_URL ??= "http://localhost:8080/api";
process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ??= "test-placeholder";

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
    "!src/components/ui/**",
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      statements: 77,
      functions: 69,
      branches: 66,
    },
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
