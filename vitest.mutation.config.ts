import path from "path";
import AutoImport from "unplugin-auto-import/vite";
import { defineConfig } from "vitest/config";

import react from "@vitejs/plugin-react";

// Used only by Stryker (stryker.config.json). Stryker's test-runner processes
// are spawned by Node, and Node cannot resolve the `bun:sqlite` builtin that
// routes/** tests reach via db/client.ts, so this runs the jsdom "client" tests
// alone. The routes/** server project is covered by `bun run test`, not here.
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
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    exclude: ["node_modules", "dist", ".output", "e2e", "routes/**"],
  },
});
