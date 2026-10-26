// @vitest-environment node
import { describe, expect, it } from "vitest";

import { formatMoney, formatNumber } from "../../../shared/i18n/format";
import { parseLocale } from "../../../shared/i18n/locale";
import { splitWords } from "../../../shared/i18n/words";

describe("formatting", () => {
  // case: SWHR2-C-0016@v1
  it("SWHR2-C-0016: money 1234.5 in en_US at precision 2 formats as $1,234.50", () => {
    expect(formatMoney(1234.5, "en_US", 2)).toBe("$1,234.50");
  });

  // case: SWHR2-C-0017@v1
  it("SWHR2-C-0017: number 1951.4 in ja_JP at precision 0 formats as 1,951", () => {
    expect(formatNumber(1951.4, "ja_JP", 0)).toBe("1,951");
  });

  // case: SWHR2-C-0019@v1
  it("SWHR2-C-0019: money 16.5 in en_US at precision 2 formats as $16.50", () => {
    expect(formatMoney(16.5, "en_US", 2)).toBe("$16.50");
  });
});

describe("keyword splitting", () => {
  // case: SWHR2-C-0018@v1
  it("SWHR2-C-0018: ' gold fish ' in en_US splits into gold and fish with no blank keyword", () => {
    expect(splitWords(" gold fish ", "en_US")).toEqual(["gold", "fish"]);
  });
});

describe("locale codes", () => {
  // case: SWHR2-C-0023@v1
  it("SWHR2-C-0023: ja_JP resolves to language ja, country JP", () => {
    expect(parseLocale("ja_JP")).toMatchObject({ language: "ja", country: "JP" });
  });

  // case: SWHR2-C-0024@v1
  it("SWHR2-C-0024: DEFAULT resolves to the server default locale (en_US)", () => {
    expect(parseLocale("DEFAULT")).toEqual(parseLocale("en_US"));
    expect(parseLocale("default")).toEqual(parseLocale("en_US"));
  });

  // case: SWHR2-C-0025@v1
  it("SWHR2-C-0025: a code without an underscore is rejected, not mapped to a locale", () => {
    const r = parseLocale("en");
    expect(r === null || r === undefined).toBe(true);
  });
});
