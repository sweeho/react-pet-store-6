import { describe, expect, it } from "vitest";

import { db } from "../db/client";

const sql = db.$client;
const count = (q: string) => (sql.query(q).get() as { n: number }).n;

sql.exec(`
  insert into catalog_categories (category_id) values ('FISH');
  insert into catalog_products (product_id, category_id) values ('FI-SW-01', 'FISH');
  insert into catalog_items (item_id, product_id) values ('EST-1', 'FI-SW-01');
`);

describe("catalog schema", () => {
  it("[SWHR2-C-0191] rejects a product whose category does not exist", () => {
    expect(() =>
      sql.exec(
        "insert into catalog_products (product_id, category_id) values ('IN-01', 'INSECTS')",
      ),
    ).toThrow(/FOREIGN KEY/i);
    expect(count("select count(*) n from catalog_products where product_id = 'IN-01'")).toBe(0);
  });

  it("[SWHR2-C-0192] rejects en_US details for EST-1 without a list price or unit cost", () => {
    expect(() =>
      sql.exec(
        "insert into catalog_item_details (item_id, locale, description, image, unit_cost) values ('EST-1', 'en_US', 'd', 'i', 1000)",
      ),
    ).toThrow(/NOT NULL/i);
    expect(() =>
      sql.exec(
        "insert into catalog_item_details (item_id, locale, description, image, list_price) values ('EST-1', 'en_US', 'd', 'i', 1650)",
      ),
    ).toThrow(/NOT NULL/i);
    expect(count("select count(*) n from catalog_item_details where item_id = 'EST-1'")).toBe(0);
  });

  it("rejects item details for an unknown item", () => {
    expect(() =>
      sql.exec(
        "insert into catalog_item_details (item_id, locale, description, image, list_price, unit_cost) values ('NOPE', 'en_US', 'd', 'i', 1, 1)",
      ),
    ).toThrow(/FOREIGN KEY/i);
  });

  it("[SWHR2-C-0204] rejects a second category with code FISH", () => {
    expect(() => sql.exec("insert into catalog_categories (category_id) values ('FISH')")).toThrow(
      /UNIQUE|PRIMARY KEY/i,
    );
    expect(count("select count(*) n from catalog_categories where category_id = 'FISH'")).toBe(1);
  });

  it("[SWHR2-C-0205] rejects a category without a code", () => {
    const before = count("select count(*) n from catalog_categories");
    expect(() => sql.exec("insert into catalog_categories (category_id) values (null)")).toThrow(
      /NOT NULL/i,
    );
    expect(count("select count(*) n from catalog_categories")).toBe(before);
  });

  it("rejects a category id longer than 10 characters", () => {
    expect(() =>
      sql.exec("insert into catalog_categories (category_id) values ('ELEVENCHARS')"),
    ).toThrow(/CHECK/i);
  });

  it("accepts a ten-character category id", () => {
    sql.exec("insert into catalog_categories (category_id) values ('TENCHARS10')");
    expect(
      count("select count(*) n from catalog_categories where category_id = 'TENCHARS10'"),
    ).toBe(1);
  });
});
