import { defineConfig } from "@playwright/test";

import base from "./playwright.config";

// The locked acceptance suite's browser specs (tests/acceptance/<capability>/e2e/*.spec.ts).
// They run against the same dev server and projects as the template's own e2e specs, and are
// red until the Build phase writes the product code, so they have a config of their own and
// the default `bun run test:e2e` never collects them.
export default defineConfig({
  ...base,
  testDir: "./tests/acceptance",
  testMatch: "**/e2e/*.spec.ts",
});
