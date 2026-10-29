import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { addItem, cartFor, lines } from "../../../services/cart";
import categoryProducts from "./categories/[categoryId]/products.get";
import productItems from "./products/[productId]/items.get";

db.$client.exec(`
  insert into catalog_categories (category_id) values ('DOGS');
  insert into catalog_category_details values ('DOGS', 'en_US', 'Dogs', 'd', 'i');
  insert into catalog_products (product_id, category_id) values ('K9-BD-01', 'DOGS');
  insert into catalog_product_details values ('K9-BD-01', 'en_US', 'Bulldog', 'd', 'i');
  insert into catalog_items (item_id, product_id) values ('EST-6', 'K9-BD-01'), ('EST-7', 'K9-BD-01');
  insert into catalog_item_details (item_id, locale, description, image, list_price, unit_cost) values
    ('EST-6', 'en_US', 'Male Adult Bulldog', 'i.gif', 1850, 1850),
    ('EST-7', 'en_US', 'Female Puppy Bulldog', 'i.gif', 1850, 1850);
`);

const call = (h: (e: H3Event) => unknown, params: Record<string, string>) => {
  const event = new H3Event(new Request("http://localhost/api/catalog/x?locale=en_US"));
  event.context.params = params;
  return h(event) as Promise<{ items: { itemId: string; description?: string }[] }>;
};

describe("browse from DOGS to Bulldog to the cart (API level)", () => {
  it("[SWHR2-C-0206] DOGS lists Bulldog and Bulldog's items are listed with ids to add", async () => {
    const products = await call(categoryProducts, { categoryId: "DOGS" });
    expect(JSON.stringify(products.items)).toContain("Bulldog");
    const items = await call(productItems, { productId: "K9-BD-01" });
    expect(items.items.map((i) => i.itemId)).toEqual(["EST-6", "EST-7"]);
    expect(JSON.stringify(items.items)).toContain("Male Adult Bulldog");
  });

  it("[SWHR2-C-0207] adding Male Adult Bulldog's item puts it in the shopper's cart", async () => {
    const cart = cartFor("shopper-1");
    addItem(cart, "EST-6");
    expect((await lines(cart, "en_US")).map((l) => l.name)).toEqual(["Male Adult Bulldog"]);
  });
});
