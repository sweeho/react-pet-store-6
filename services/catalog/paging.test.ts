import { describe, expect, it } from "vitest";

import { pageOf } from "./paging";

const four = ["Angelfish", "Goldfish", "Koi", "Tiger Shark"];

describe("pageOf", () => {
  it("[SWHR2-C-0186] with no paging values the first 2 of 4 products are returned", () => {
    const page = pageOf(four.slice(0, 3));
    expect(page.items).toEqual(["Angelfish", "Goldfish"]);
    expect(page).toMatchObject({ start: 0, size: 2, hasPrevious: false, hasNext: true });
  });

  it("[SWHR2-C-0187] with only page size 3, products 1 through 3 are returned", () => {
    const page = pageOf(four, undefined, 3);
    expect(page.items).toEqual(["Angelfish", "Goldfish", "Koi"]);
    expect(page).toMatchObject({ start: 0, size: 3, hasPrevious: false, hasNext: true });
  });

  it("computes previous and next starts from the entries returned", () => {
    const page = pageOf(["c", "d"], 2, 2);
    expect(page).toMatchObject({
      hasPrevious: true,
      hasNext: false,
      previousStart: 0,
      nextStart: 4,
    });
  });

  it("uses the legacy previous start from a short page (max(start - count, 0))", () => {
    expect(pageOf(["e"], 4, 2)).toMatchObject({ previousStart: 3, nextStart: 5 });
  });

  it("returns the empty page for a negative or out-of-range start", () => {
    const empty = {
      items: [],
      start: 0,
      hasPrevious: false,
      hasNext: false,
      previousStart: 0,
      nextStart: 0,
    };
    expect(pageOf(four, -1, 2)).toMatchObject(empty);
    expect(pageOf([], 9, 2)).toMatchObject(empty);
  });
});
