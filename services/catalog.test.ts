import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { getItem } from "./catalog";

db.$client.exec(`
  insert into catalog_categories (category_id) values ('T');
  insert into catalog_products (product_id, category_id) values ('T-P', 'T');
  insert into catalog_product_details values ('T-P', 'en_US', 'Angelfish', 'p', 'p.gif');
  insert into catalog_product_details values ('T-P', 'ja_JP', 'エンゼル', 'p', 'p.gif');
  insert into catalog_items (item_id, product_id) values ('T-1', 'T-P');
  insert into catalog_item_details (item_id, locale, description, image, list_price, unit_cost, attr1)
    values ('T-1', 'en_US', 'Large Angelfish', 'i.gif', 16.5, 10, 'Spotted fish');
  insert into catalog_item_details (item_id, locale, description, image, list_price, unit_cost, attr1)
    values ('T-1', 'ja_JP', '大きなエンゼルフィッシュ', 'i.gif', 1951, 1551, '斑点のある魚');
`);

describe("catalog service", () => {
  it("[SWHR2-C-0029] a ja_JP shopper gets the Japanese name, description and attributes", () => {
    const item = getItem("T-1", "ja_JP");
    expect(item).toMatchObject({
      name: "エンゼル",
      description: "大きなエンゼルフィッシュ",
      attributes: ["斑点のある魚"],
    });
    expect(JSON.stringify(item)).not.toMatch(/Angelfish|Spotted/);
  });

  it("[SWHR2-C-0030] an en_US shopper gets the English name, description and attributes", () => {
    const item = getItem("T-1", "en_US");
    expect(item).toMatchObject({
      name: "Angelfish",
      description: "Large Angelfish",
      attributes: ["Spotted fish"],
    });
    expect(JSON.stringify(item)).not.toMatch(/エンゼル|斑点/);
  });

  it("returns nothing for a locale without detail rows", () => {
    expect(getItem("T-1", "zh_CN")).toBeUndefined();
  });
});
