import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { fonts } from "../configs/fonts.config";

const css = readFileSync("src/index.css", "utf8");
const light = css.slice(css.indexOf(":root"), css.indexOf(".dark {"));
const token = (name: string) => new RegExp(`${name}:\\s*([^;]+);`).exec(light)?.[1];

describe("design tokens", () => {
  it.each([
    ["--background", "#ffffff"],
    ["--card", "#f8fafc"],
    ["--border", "#e2e8f0"],
    ["--foreground", "#0f172a"],
    ["--muted-foreground", "#64748b"],
    ["--primary", "#4f46e5"],
    ["--primary-foreground", "#ffffff"],
    ["--destructive", "#dc2626"],
  ])("%s is %s", (name, value) => {
    expect(token(name)).toBe(value);
  });

  it("light destructive-foreground differs from destructive", () => {
    expect(token("--destructive-foreground")).not.toBe(token("--destructive"));
  });

  it("uses Inter and JetBrains Mono", () => {
    expect(fonts.map((f) => f.name)).toEqual(["Inter", "JetBrains Mono"]);
    expect(css).toContain("--font-sans: 'Inter'");
    expect(css).toContain("--font-mono: 'JetBrains Mono'");
  });
});
