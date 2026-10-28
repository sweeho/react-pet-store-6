import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE, parseLocale } from "./locale";

describe("parseLocale", () => {
  it("[SWHR2-C-0023] ja_JP resolves to language ja, country JP", () => {
    expect(parseLocale("ja_JP")).toMatchObject({ language: "ja", country: "JP", code: "ja_JP" });
  });

  it("[SWHR2-C-0024] DEFAULT in any case resolves to the default locale", () => {
    expect(parseLocale("DEFAULT")).toEqual(parseLocale(DEFAULT_LOCALE));
    expect(parseLocale("default")).toEqual(parseLocale("en_US"));
  });

  it("[SWHR2-C-0025] a code without an underscore is rejected", () => {
    expect(parseLocale("en")).toBeNull();
  });
});
