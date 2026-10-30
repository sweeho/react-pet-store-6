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
  // A test for a feature that does not exist yet fails by WAITING for its first element, so the
  // timeout is what each such test costs: 60 of 66 tests at 15 s was a 7 minute step on every push.
  // Restore the template's retries and a longer timeout once the Build phase has made the suite
  // green (the longest passing test took 1.2 s).
  retries: 0,
  timeout: 4_000,
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
    // Operator credentials for the browser tests (userId:argon2id hash; entries joined by ";").
    // Precomputed because this file runs under Node, which has no Bun.password.
    env: {
      ADMIN_USERS:
        "admin:$argon2id$v=19$m=65536,t=2,p=1$PoyCjTXbe0xFebegBw1WzK4plVGYksanvx9UFVn5PqU$MAVlWVXK0dK6B8rBBi4cAQFe2uL/tLVt5Yp9Rfra6uA",
      SUPPLIER_USERS:
        "supplier:$argon2id$v=19$m=65536,t=2,p=1$wYWWH+JipcnZuelxAfMywWci1gCLFGtG+3AnmNJ1M64$u3qmvY/iCY8QCvCoFeswt0DXHJgxyr+2EyTUTXPmnik",
    },
  },
});
