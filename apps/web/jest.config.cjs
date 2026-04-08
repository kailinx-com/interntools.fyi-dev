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
      lines: 82,
      statements: 78,
      functions: 69,
      branches: 66,
    },
  },
  testPathIgnorePatterns: ["<rootDir>/tests/e2e/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

module.exports = createJestConfig(customJestConfig);
