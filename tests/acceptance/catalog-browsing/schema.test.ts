// @vitest-environment node
import { describe, expect, it } from "vitest";

import { loadCatalog, seeder } from "./harness";

const count = (client: import("bun:sqlite").Database, sql: string) =>
  (client.query(sql).get() as { n: number }).n;

describe("catalog schema constraints", () => {
  // case: SWHR2-C-0191@v1
  it("SWHR2-C-0191: a product with category INSECTS that does not exist is rejected", async () => {
    const { client } = await loadCatalog();
    expect(() =>
      client.exec(
        "insert into catalog_products (product_id, category_id) values ('IN-01', 'INSECTS')",
      ),
    ).toThrow(/FOREIGN KEY/i);
    expect(
      count(client, "select count(*) n from catalog_products where product_id = 'IN-01'"),
    ).toBe(0);
  });

  // case: SWHR2-C-0192@v1
  it("SWHR2-C-0192: en_US details for EST-1 are rejected without a list price or a unit cost", async () => {
    const { client } = await loadCatalog();
    const s = seeder(client);
    s.category("FISH", { en_US: "Fish" });
    s.product("FI-SW-01", "FISH", { en_US: "Angelfish" });
    client.exec("insert into catalog_items (item_id, product_id) values ('EST-1', 'FI-SW-01')");
    expect(() =>
      client.exec(
        "insert into catalog_item_details (item_id, locale, description, image, unit_cost) values ('EST-1', 'en_US', 'd', 'i.gif', 1000)",
      ),
    ).toThrow(/NOT NULL/i);
    expect(() =>
      client.exec(
        "insert into catalog_item_details (item_id, locale, description, image, list_price) values ('EST-1', 'en_US', 'd', 'i.gif', 1650)",
      ),
    ).toThrow(/NOT NULL/i);
    expect(
      count(client, "select count(*) n from catalog_item_details where item_id = 'EST-1'"),
    ).toBe(0);
  });

  // case: SWHR2-C-0204@v1
  it("SWHR2-C-0204: a second category with code FISH is rejected", async () => {
    const { client } = await loadCatalog();
    seeder(client).category("FISH", { en_US: "Fish" });
    expect(() =>
      client.exec("insert into catalog_categories (category_id) values ('FISH')"),
    ).toThrow(/UNIQUE|PRIMARY KEY/i);
    expect(
      count(client, "select count(*) n from catalog_categories where category_id = 'FISH'"),
    ).toBe(1);
  });

  // case: SWHR2-C-0205@v1
  it("SWHR2-C-0205: a category without a code is rejected", async () => {
    const { client } = await loadCatalog();
    const before = count(client, "select count(*) n from catalog_categories");
    expect(() => client.exec("insert into catalog_categories (category_id) values (null)")).toThrow(
      /NOT NULL/i,
    );
    expect(count(client, "select count(*) n from catalog_categories")).toBe(before);
  });
});
