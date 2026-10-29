import { describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { getItem } from "./index";

db.$client.exec(`
  insert into catalog_categories (category_id) values ('U');
  insert into catalog_products (product_id, category_id) values ('U-P', 'U');
  insert into catalog_product_details values ('U-P', 'en_US', 'Koi', 'p', 'p.gif');
  insert into catalog_items (item_id, product_id) values ('U-1', 'U-P');
  insert into catalog_item_details (item_id, locale, description, image, list_price, unit_cost)
    values ('U-1', 'en_US', 'Koi', 'i.gif', 1650, 1000);
`);

describe("item detail is not cached", () => {
  it("[SWHR2-C-0190] shows a new unit price immediately", async () => {
    expect((await getItem("U-1", "en_US"))?.unitCost).toBe(1000);
    db.$client.exec("update catalog_item_details set unit_cost = 1200 where item_id = 'U-1'");
    expect((await getItem("U-1", "en_US"))?.unitCost).toBe(1200);
  });
});
