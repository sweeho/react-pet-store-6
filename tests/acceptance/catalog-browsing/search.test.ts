// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  boundKeywords,
  catalogCalls,
  idOf,
  loadCatalog,
  recordQueries,
  rows,
  seeder,
} from "./harness";

async function fishCatalog() {
  const env = await loadCatalog();
  const s = seeder(env.client);
  s.category("FISH", { en_US: "Fish" });
  s.category("DOGS", { en_US: "Dogs" });
  s.product("FI-SW-01", "FISH", { en_US: "Angelfish" });
  s.product("FI-FW-02", "FISH", { en_US: "Carp" });
  s.product("K-9-01", "DOGS", { en_US: "Bulldog" });
  s.item({
    id: "EST-1",
    product: "FI-SW-01",
    details: { en_US: { descn: "Salt water fish", list: 1650, unit: 1000 } },
  });
  s.item({
    id: "EST-4",
    product: "FI-FW-02",
    details: { en_US: { descn: "Spotted koi from Japan", list: 2000, unit: 1500 } },
  });
  s.item({
    id: "EST-6",
    product: "K-9-01",
    details: { en_US: { descn: "Friendly pup", list: 3000, unit: 2000 } },
  });
  return env;
}

describe("catalog search", () => {
  // case: SWHR2-C-0178@v1
  it("SWHR2-C-0178: 'angel koi' in en_US returns both the Angelfish item and the koi-described item", async () => {
    const { catalog } = await fishCatalog();
    const ids = rows(await catalog.search("angel koi", "en_US")).map(idOf);
    expect(ids).toEqual(expect.arrayContaining(["EST-1", "EST-4"]));
  });

  // case: SWHR2-C-0179@v1
  it("SWHR2-C-0179: 'fish' returns an item through its category id FISH even when no text matches", async () => {
    const env = await loadCatalog();
    const s = seeder(env.client);
    // the category's name and description are "Aquatic", so only its id FISH can match "fish"
    s.category("FISH", { en_US: "Aquatic" });
    s.product("FI-FW-02", "FISH", { en_US: "Koi" });
    s.item({
      id: "EST-4",
      product: "FI-FW-02",
      details: { en_US: { descn: "Spotted pond swimmer", list: 2000, unit: 1500 } },
    });
    const ids = rows(await env.catalog.search("fish", "en_US")).map(idOf);
    expect(ids).toContain("EST-4");
  });

  // case: SWHR2-C-0180@v1
  it("SWHR2-C-0180: 'fish fish koi' searches for the two distinct keywords fish and koi", async () => {
    const { client, catalog } = await fishCatalog();
    const calls = recordQueries(client);
    await catalog.search("fish fish koi", "en_US");
    const counts = boundKeywords(calls);
    expect([...counts.keys()].sort()).toEqual(["fish", "koi"]);
    // each keyword is bound the same number of times: "fish" is not searched twice
    expect(counts.get("fish")).toBe(counts.get("koi"));
  });

  // case: SWHR2-C-0181@v1
  it("SWHR2-C-0181: 'Dog' in mixed case returns the Bulldog item", async () => {
    const { catalog } = await fishCatalog();
    const ids = rows(await catalog.search("Dog", "en_US")).map(idOf);
    expect(ids).toContain("EST-6");
  });

  // case: SWHR2-C-0182@v1
  it("SWHR2-C-0182: empty or whitespace-only text returns an empty result without querying the catalog", async () => {
    const { client, catalog } = await fishCatalog();
    const calls = recordQueries(client);
    expect(rows(await catalog.search("", "en_US"))).toEqual([]);
    expect(rows(await catalog.search("   ", "en_US"))).toEqual([]);
    expect(catalogCalls(calls)).toEqual([]);
  });

  // case: SWHR2-C-0208@v1
  it("SWHR2-C-0208: 'koi\\tkoi angel' splits into the two keywords koi and angel", async () => {
    const { client, catalog } = await fishCatalog();
    const calls = recordQueries(client);
    await catalog.search("koi\tkoi angel", "en_US");
    const counts = boundKeywords(calls);
    expect([...counts.keys()].sort()).toEqual(["angel", "koi"]);
    expect(counts.get("angel")).toBe(counts.get("koi"));
  });

  // case: SWHR2-C-0209@v1
  it("SWHR2-C-0209: a single-space query returns an empty result without querying the catalog", async () => {
    const { client, catalog } = await fishCatalog();
    const calls = recordQueries(client);
    expect(rows(await catalog.search(" ", "en_US"))).toEqual([]);
    expect(catalogCalls(calls)).toEqual([]);
  });
});
