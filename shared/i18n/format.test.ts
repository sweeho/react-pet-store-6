import { describe, expect, it } from "vitest";

import { formatMoney, formatNumber } from "./format";
import { splitWords } from "./words";

describe("formatting", () => {
  it("[SWHR2-C-0016] money 1234.5 in en_US at precision 2 formats as $1,234.50", () => {
    expect(formatMoney(1234.5, "en_US", 2)).toBe("$1,234.50");
  });

  it("[SWHR2-C-0017] number 1951.4 in ja_JP at precision 0 formats as 1,951", () => {
    expect(formatNumber(1951.4, "ja_JP", 0)).toBe("1,951");
  });

  it("[SWHR2-C-0019] money 16.5 in en_US at precision 2 formats as $16.50", () => {
    expect(formatMoney(16.5, "en_US", 2)).toBe("$16.50");
  });
});

describe("splitWords", () => {
  it("[SWHR2-C-0018] ' gold fish ' in en_US splits into gold and fish with no blank keyword", () => {
    expect(splitWords(" gold fish ", "en_US")).toEqual(["gold", "fish"]);
  });
});
