import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../../db/client";
import handler from "./[itemId].get";

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

const read = async (locale: string) => {
  const event = new H3Event(new Request(`http://localhost/api/catalog/items/T-1?locale=${locale}`));
  event.context.params = { itemId: "T-1" };
  return JSON.stringify(await handler(event));
};

describe("GET /api/catalog/items/[itemId]", () => {
  it("[SWHR2-C-0029] a ja_JP shopper gets the Japanese details and none of the English", async () => {
    const out = await read("ja_JP");
    expect(out).toContain("エンゼル");
    expect(out).toContain("大きなエンゼルフィッシュ");
    expect(out).toContain("斑点のある魚");
    expect(out).not.toContain("Angelfish");
    expect(out).not.toContain("Spotted fish");
  });

  it("[SWHR2-C-0030] an en_US shopper gets the English details and none of the Japanese", async () => {
    const out = await read("en_US");
    expect(out).toContain("Angelfish");
    expect(out).toContain("Large Angelfish");
    expect(out).toContain("Spotted fish");
    expect(out).not.toContain("エンゼル");
    expect(out).not.toContain("斑点のある魚");
  });
});
