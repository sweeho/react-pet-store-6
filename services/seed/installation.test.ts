// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const read = (f: string) => readFileSync(path.join(process.cwd(), f), "utf8");

describe("installation sequence", () => {
  it("[SWHR2-C-0079] every browser run and the dev server seed the database before the application starts", () => {
    const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
    expect(pkg.scripts["db:seed"]).toBe("bun scripts/seed.ts");
    expect(pkg.scripts.predev).toContain("db:seed");
    for (const f of ["playwright.config.ts", "playwright.acceptance.config.ts"])
      expect(read(f), f).toMatch(/command:\s*["'`]bun scripts\/seed\.ts &&/);
  });
});
