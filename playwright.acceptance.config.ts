import { defineConfig, devices } from "@playwright/test";

// Browser specs of the acceptance suite (tests/acceptance/<capability>/e2e/),
// run via `bun run test:acceptance:e2e`. Kept apart from playwright.config.ts
// because the suite is red until the Build phase makes it pass.
//
// Own port (5179) so it never collides with the dev server (5000) or the
// regular E2E run (5178). See playwright.config.ts for why the server is
// started this way.
const PORT = 5179;

export default defineConfig({
  testDir: "./tests/acceptance",
  testMatch: "**/e2e/**/*.spec.ts",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // No retries and a short per-test timeout: the suite is red until Build, so a retry cannot turn
  // a test green, it only makes the run slower, and the design gate waits for the whole run.
  // Restore the template's retries once the Build phase has made the suite green.
  retries: 0,
  timeout: 15_000,
  expect: { timeout: 3_000 },
  reporter: process.env.CI
    ? [["list"], ["junit", { outputFile: ".vortex-results/acceptance/e2e-junit.xml" }]]
    : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `bun --bun ./node_modules/vite/bin/vite.js --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
  },
});
