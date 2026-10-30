import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import getCart from "./index.get";
import addToCart from "./items.post";
import removeFromCart from "./items/[itemId].delete";

db.$client.exec(`
  insert into catalog_categories (category_id) values ('R');
  insert into catalog_products (product_id, category_id) values ('R-P', 'R');
  insert into catalog_product_details values ('R-P', 'en_US', 'Angelfish', 'p', 'p.gif');
  insert into catalog_items (item_id, product_id) values ('R-1', 'R-P');
  insert into catalog_items (item_id, product_id) values ('R-2', 'R-P');
  insert into catalog_item_details (item_id, locale, description, image, list_price, unit_cost, attr1)
    values ('R-1', 'en_US', 'Large Angelfish', 'i.gif', 1650, 1000, 'a');
  insert into catalog_item_details (item_id, locale, description, image, list_price, unit_cost, attr1)
    values ('R-2', 'en_US', 'Small Angelfish', 'i.gif', 1650, 1000, 'a');
`);

const event = (url: string, init: RequestInit = {}, params?: Record<string, string>) => {
  const e = new H3Event(new Request(`http://localhost${url}`, init));
  e.context.session = { id: "sess-routes" };
  if (params) e.context.params = params;
  return e;
};
const add = (itemId: string) =>
  addToCart(
    event("/api/cart/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ itemId }),
    }),
  );
const ids = async () =>
  ((await getCart(event("/api/cart"))) as { lines: { itemId: string }[] }).lines.map(
    (l) => l.itemId,
  );

describe("cart routes", () => {
  it("[SWHR2-C-0094] an anonymous visitor can remove an item without a role check refusing it", async () => {
    await add("R-1");
    await removeFromCart(event("/api/cart/items/R-1", { method: "DELETE" }, { itemId: "R-1" }));
    expect(await ids()).not.toContain("R-1");
  });

  it("[SWHR2-C-0098] removing R-1 from a cart holding R-1 and R-2 leaves only R-2", async () => {
    await add("R-1");
    await add("R-2");
    await removeFromCart(event("/api/cart/items/R-1", { method: "DELETE" }, { itemId: "R-1" }));
    expect(await ids()).toEqual(["R-2"]);
  });
});
