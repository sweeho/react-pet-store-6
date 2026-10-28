import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("./registry");
});

async function load() {
  vi.doMock("./registry", () => {
    const registry = {
      en_US: { main: { text: "Welcome" }, only: { text: "English only" } },
      ja_JP: { main: { text: "ようこそ" } },
      zh_CN: { main: { text: "欢迎" } },
    };
    return { registry, default: registry };
  });
  return (await import("./resolveScreen")).resolveScreen;
}

describe("resolveScreen", () => {
  it("[SWHR2-C-0035] the request locale ja_JP overrides the session locale en_US", async () => {
    const resolveScreen = await load();
    const r = resolveScreen({ screen: "main", requestLocale: "ja_JP", sessionLocale: "en_US" });
    expect(r).toEqual({ locale: "ja_JP", definition: { text: "ようこそ" } });
  });

  it("[SWHR2-C-0036] session locale de_DE without definitions falls back to en_US", async () => {
    const resolveScreen = await load();
    const r = resolveScreen({ screen: "main", sessionLocale: "de_DE" });
    expect(r).toEqual({ locale: "en_US", definition: { text: "Welcome" } });
  });

  it("[SWHR2-C-0037] a screen only in en_US is shown in en_US for zh_CN", async () => {
    const resolveScreen = await load();
    const r = resolveScreen({ screen: "only", sessionLocale: "zh_CN" });
    expect(r.definition).toEqual({ text: "English only" });
    expect(r.locale).toBe("en_US");
  });

  it("[SWHR2-C-0038] a screen defined nowhere throws the not-found error", async () => {
    const resolveScreen = await load();
    expect(() => resolveScreen({ screen: "unknown", sessionLocale: "en_US" })).toThrow(
      "Definition for screen unknown not found",
    );
  });
});
