// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { loadCatalog, nameOf, rows, seeder } from "./harness";

afterEach(() => vi.useRealTimers());

async function fish() {
  const env = await loadCatalog();
  const s = seeder(env.client);
  s.category("FISH", { en_US: "Fish" });
  s.product("FI-FW-01", "FISH", { en_US: "Koi" });
  return { ...env, s };
}

describe("catalog page cache", () => {
  // case: SWHR2-C-0188@v1
  it("SWHR2-C-0188: a product added to FISH appears in its list 6 minutes later", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const { catalog, s } = await fish();
    await catalog.listProducts("FISH", "en_US", 0, 10); // viewed once, now cached
    s.product("FI-FW-03", "FISH", { en_US: "Goldfish" });
    vi.setSystemTime(Date.now() + 6 * 60 * 1000);
    const names = rows(await catalog.listProducts("FISH", "en_US", 0, 10)).map(nameOf);
    expect(names).toContain("Goldfish");
  });

  // case: SWHR2-C-0189@v1
  it("SWHR2-C-0189: within 5 minutes shopper B is served the FISH list cached from shopper A's view", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const { client, catalog } = await fish();
    const forA = rows(await catalog.listProducts("FISH", "en_US", 0, 10)).map(nameOf); // shopper A at T0
    expect(forA).toEqual(["Koi"]);
    vi.setSystemTime(Date.now() + 60 * 1000);
    client.exec(
      "update catalog_product_details set name = 'Koi Carp' where product_id = 'FI-FW-01' and locale = 'en_US'",
    );
    // the store now holds the new name, so a fresh read would say "Koi Carp"
    expect(
      client
        .query(
          "select name from catalog_product_details where product_id = 'FI-FW-01' and locale = 'en_US'",
        )
        .get(),
    ).toEqual({ name: "Koi Carp" });
    const forB = rows(await catalog.listProducts("FISH", "en_US", 0, 10)).map(nameOf); // shopper B at T0 + 1 min
    expect(forB).toEqual(forA);
  });

  // case: SWHR2-C-0190@v1
  it("SWHR2-C-0190: an item detail shows a new unit price immediately", async () => {
    const { client, catalog, s } = await fish();
    s.item({
      id: "EST-1",
      product: "FI-FW-01",
      details: { en_US: { descn: "Koi", list: 1650, unit: 1000 } },
    });
    expect(JSON.stringify(await catalog.getItem("EST-1", "en_US"))).toMatch(/10\.00|\b10\b|1000/);
    client.exec("update catalog_item_details set unit_cost = 1200 where item_id = 'EST-1'");
    expect(JSON.stringify(await catalog.getItem("EST-1", "en_US"))).toMatch(/12\.00|\b12\b|1200/);
  });
});
