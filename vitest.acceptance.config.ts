import path from "path";
import AutoImport from "unplugin-auto-import/vite";
import { defineConfig } from "vitest/config";

import react from "@vitejs/plugin-react";

// Runs ONLY the acceptance suite (tests/acceptance/**), via `bun run
// test:acceptance`. The suite is written before the product code, so it is
// kept out of the default `bun run test` (vitest.config.ts) until the Build
// phase makes it green. Browser specs under tests/acceptance/<capability>/e2e/
// belong to playwright.acceptance.config.ts, not here.
//
// Same environment split as vitest.config.ts: anything that may reach
// db/client.ts (bun:sqlite) needs a node environment, so *.test.ts runs in
// "acceptance-server" (node) and *.test.tsx (UI) in "acceptance-client" (jsdom).
export default defineConfig({
  plugins: [
    react(),
    AutoImport({
      imports: ["react", "react-router"],
      dts: "./auto-imports.d.ts",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "acceptance-client",
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
          css: false,
          include: ["tests/acceptance/**/*.test.tsx"],
          exclude: ["tests/acceptance/**/e2e/**"],
        },
      },
      {
        extends: true,
        test: {
          name: "acceptance-server",
          environment: "node",
          include: ["tests/acceptance/**/*.test.ts"],
          exclude: ["tests/acceptance/**/e2e/**"],
        },
      },
    ],
  },
});
