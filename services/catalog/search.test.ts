// @vitest-environment node
import { describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { search } from "./index";

const client = db.$client;

client.exec(`
  insert into catalog_categories (category_id) values ('FISH'), ('DOGS');
  insert into catalog_products (product_id, category_id) values
    ('FI-SW-01', 'FISH'), ('FI-FW-02', 'FISH'), ('K-9-01', 'DOGS');
  insert into catalog_product_details values
    ('FI-SW-01', 'en_US', 'Angelfish', 'd', 'p.gif'),
    ('FI-FW-02', 'en_US', 'Pond', 'd', 'p.gif'),
    ('K-9-01', 'en_US', 'Bulldog', 'd', 'p.gif'),
    ('K-9-01', 'ja_JP', 'ブルドッグ', 'd', 'p.gif');
  insert into catalog_items (item_id, product_id) values
    ('EST-1', 'FI-SW-01'), ('EST-4', 'FI-FW-02'), ('EST-6', 'K-9-01');
  insert into catalog_item_details (item_id, locale, description, image, list_price, unit_cost) values
    ('EST-1', 'en_US', 'Salt water swimmer', 'i', 1650, 1000),
    ('EST-4', 'en_US', 'Spotted koi from Japan', 'i', 2000, 1500),
    ('EST-6', 'en_US', 'Friendly pup', 'i', 3000, 2000),
    ('EST-6', 'ja_JP', 'やさしい子犬', 'i', 3000, 2000);
`);

type Call = { sql: string; params: unknown[] };

/** Records every statement run against catalog tables while `fn` runs. */
async function spy<T>(fn: () => Promise<T>): Promise<{ result: T; calls: Call[] }> {
  const calls: Call[] = [];
  const realPrepare = client.prepare.bind(client);
  // @ts-expect-error spy replaces the overloaded prepare
  client.prepare = (sql: string, ...rest: unknown[]) => {
    const stmt = (realPrepare as (...a: unknown[]) => Record<string, unknown>)(sql, ...rest);
    for (const m of ["all", "get", "values", "run"]) {
      const orig = stmt[m] as (...a: unknown[]) => unknown;
      stmt[m] = (...args: unknown[]) => {
        if (/catalog_/.test(sql)) calls.push({ sql, params: args.flat(Infinity) });
        return orig.apply(stmt, args);
      };
    }
    return stmt;
  };
  try {
    return { result: await fn(), calls };
  } finally {
    client.prepare = realPrepare as typeof client.prepare;
  }
}

const bound = (calls: Call[]) => {
  const counts = new Map<string, number>();
  for (const c of calls)
    for (const p of c.params) {
      const m = typeof p === "string" ? /^%(.+)%$/.exec(p) : null;
      if (m) counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
    }
  return counts;
};

const ids = async (text: string, locale = "en_US") =>
  (await search(text, locale, 0, 10)).items.map((i) => i.itemId).sort();

describe("catalog keyword search", () => {
  it("[SWHR2-C-0178] 'angel koi' returns the Angelfish item and the koi-described item", async () => {
    expect(await ids("angel koi")).toEqual(["EST-1", "EST-4"]);
  });

  it("[SWHR2-C-0179] 'fish' returns an item through its category id", async () => {
    expect(await ids("fish")).toEqual(expect.arrayContaining(["EST-4"]));
  });

  it("[SWHR2-C-0180] 'fish fish koi' searches for the two distinct keywords", async () => {
    const { calls } = await spy(() => search("fish fish koi", "en_US"));
    const counts = bound(calls);
    expect([...counts.keys()].sort()).toEqual(["fish", "koi"]);
    expect(counts.get("fish")).toBe(counts.get("koi"));
  });

  it("[SWHR2-C-0181] a mixed-case 'Dog' returns the Bulldog item", async () => {
    expect(await ids("Dog")).toContain("EST-6");
  });

  it("[SWHR2-C-0182] empty or whitespace-only text returns nothing without a query", async () => {
    const { result, calls } = await spy(async () => [
      await search("", "en_US"),
      await search("   ", "en_US"),
    ]);
    expect(result.map((r) => r.items)).toEqual([[], []]);
    expect(calls).toEqual([]);
  });

  it("[SWHR2-C-0208] 'koi\\tkoi angel' splits into koi and angel", async () => {
    const { calls } = await spy(() => search("koi\tkoi angel", "en_US"));
    const counts = bound(calls);
    expect([...counts.keys()].sort()).toEqual(["angel", "koi"]);
    expect(counts.get("angel")).toBe(counts.get("koi"));
  });

  it("[SWHR2-C-0209] a single space returns nothing without a query", async () => {
    const { result, calls } = await spy(() => search(" ", "en_US"));
    expect(result.items).toEqual([]);
    expect(calls).toEqual([]);
  });

  it("returns each item once and only in the requested locale", async () => {
    expect(await ids("dog bull")).toEqual(["EST-6"]);
    expect(await ids("犬", "ja_JP")).toEqual(["EST-6"]);
    expect(await ids("koi", "ja_JP")).toEqual([]);
  });

  it("treats % and _ in a keyword literally", async () => {
    expect(await ids("%")).toEqual([]);
    expect(await ids("_")).toEqual([]);
  });
});
