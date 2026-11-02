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
  // No retries: the suite is red until Build, so a retry cannot turn a test green, it only makes
  // the run slower. The timeouts stay at 15 s per test and 5 s per expect even though the red
  // suite then runs longer: during Build the merge gate reads this run on every ticket, and a flow
  // that signs in and checks out takes several seconds on a CI runner. Shorter waits failed
  // working checkout flows by timeout.
  retries: 0,
  timeout: 15_000,
  expect: { timeout: 5_000 },
  reporter: process.env.CI
    ? [["list"], ["junit", { outputFile: ".vortex-results/acceptance/e2e-junit.xml" }]]
    : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    // An agent container's small /dev/shm hangs Chromium; use /tmp instead.
    launchOptions: { args: ["--disable-dev-shm-usage"] },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `bun scripts/seed.ts && bun --bun ./node_modules/vite/bin/vite.js --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    // Operator credentials for the browser tests (userId:argon2id hash; entries joined by ";").
    // Precomputed because this file runs under Node, which has no Bun.password.
    env: {
      ADMIN_USERS:
        "admin:$argon2id$v=19$m=8,t=1,p=1$G8TGhWZU6qATZrDg8QfPXNh/HBdmSNMdfOC6IendcUI$+IYalX+fc3nTt9vfn42t1fQ9Deks9Pj78cWjrc9nsyE",
      SUPPLIER_USERS:
        "supplier:$argon2id$v=19$m=8,t=1,p=1$k3wQdUiE8cLlHrUKJL/+o7Vk8wCPvEuukMSkjR9QFzE$a+4Zsl3vz3MSAxbGk+knMfH1fSLCMv3syvMoeoJMPC8",
    },
  },
});
