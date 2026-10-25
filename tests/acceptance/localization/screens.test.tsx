import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.doUnmock("../../../src/locales/registry");
});

// Assumed shape: the registry is `registry[locale][screen] = definition`, and
// `resolveScreen({ screen, requestLocale?, sessionLocale })` returns `{ locale, definition }`
// or throws / returns an error carrying "Definition for screen <name> not found".
async function resolver() {
  vi.doMock("../../../src/locales/registry", () => {
    const registry = {
      en_US: { main: { text: "Welcome" }, only: { text: "English only" } },
      ja_JP: { main: { text: "ようこそ" } },
      zh_CN: { main: { text: "欢迎" } },
    };
    return { registry, default: registry };
  });
  const mod = await import("../../../src/locales/resolveScreen");
  return async (args: { screen: string; requestLocale?: string; sessionLocale: string }) => {
    try {
      const r = await (mod.resolveScreen as (a: typeof args) => unknown)(args);
      return JSON.stringify(r);
    } catch (e) {
      return String((e as Error).message ?? e);
    }
  };
}

describe("screen locale resolution", () => {
  // case: SWHR2-C-0035@v1
  it("SWHR2-C-0035: locale ja_JP on the request overrides session locale en_US", async () => {
    const resolve = await resolver();
    const out = await resolve({ screen: "main", requestLocale: "ja_JP", sessionLocale: "en_US" });
    expect(out).toContain("ようこそ");
    expect(out).not.toContain("Welcome");
  });

  // case: SWHR2-C-0036@v1
  it("SWHR2-C-0036: session locale de_DE with no German definitions falls back to en_US", async () => {
    const resolve = await resolver();
    const out = await resolve({ screen: "main", sessionLocale: "de_DE" });
    expect(out).toContain("Welcome");
    expect(out).not.toMatch(/not found/i);
  });

  // case: SWHR2-C-0037@v1
  it("SWHR2-C-0037: a screen defined only for en_US is shown in en_US when the session locale is zh_CN", async () => {
    const resolve = await resolver();
    expect(await resolve({ screen: "only", sessionLocale: "zh_CN" })).toContain("English only");
  });

  // case: SWHR2-C-0038@v1
  it("SWHR2-C-0038: a screen defined in no locale shows a not-found error", async () => {
    const resolve = await resolver();
    expect(await resolve({ screen: "unknown", sessionLocale: "en_US" })).toContain(
      "Definition for screen unknown not found",
    );
  });
});

describe("change-language screen", () => {
  // case: SWHR2-C-0020@v1
  it("SWHR2-C-0020: shows four locale options and a Change Locale button for any session locale", async () => {
    const { default: ChangeLanguage } = await import("../../../src/pages/petstore/change-language");
    for (const locale of ["en_US", "ja_JP"]) {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => Response.json({ locale })),
      );
      const { unmount } = render(
        <MemoryRouter>
          <ChangeLanguage />
        </MemoryRouter>,
      );
      const select = await screen.findByRole("combobox");
      const options = within(select)
        .getAllByRole("option")
        .map((o) => o.textContent?.trim());
      expect(options).toEqual(["US English", "German", "Japanese", "Simplified Chinese"]);
      expect(screen.getByRole("button", { name: "Change Locale" })).toBeInTheDocument();
      unmount();
    }
  });
});
