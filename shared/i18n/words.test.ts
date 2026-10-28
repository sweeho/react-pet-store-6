import { describe, expect, it } from "vitest";

import { splitWords } from "./words";

describe("splitWords", () => {
  it("[SWHR2-C-0018] ' gold fish ' in en_US splits into gold and fish with no blank keyword", () => {
    const words = splitWords(" gold fish ", "en_US");
    expect(words).toEqual(["gold", "fish"]);
    expect(words.every((w) => w.trim() !== "")).toBe(true);
  });

  it("splits Chinese text into word segments", () => {
    expect(splitWords("金鱼", "zh_CN").join("")).toBe("金鱼");
  });
});
