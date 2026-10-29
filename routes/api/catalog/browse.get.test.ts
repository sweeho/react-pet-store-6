import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import categories from "./categories.get";
import category from "./categories/[categoryId].get";
import product from "./products/[productId].get";
import items from "./products/[productId]/items.get";
import search from "./search.get";

db.$client.exec(`
  insert into catalog_categories (category_id) values ('BR');
  insert into catalog_category_details values ('BR', 'en_US', 'Br', 'd', 'i');
  insert into catalog_products (product_id, category_id) values ('BR-1', 'BR');
  insert into catalog_product_details values ('BR-1', 'en_US', 'Brook', 'd', 'i');
  insert into catalog_items (item_id, product_id) values ('BR-I', 'BR-1');
  insert into catalog_item_details (item_id, locale, description, image, list_price, unit_cost)
    values ('BR-I', 'en_US', 'Brook trout', 'i.gif', 1650, 1000);
`);

type Handler = (e: H3Event) => unknown;
const call = async (h: Handler, qs: string, params: Record<string, string> = {}) => {
  const event = new H3Event(new Request(`http://localhost/api/catalog/x${qs}`));
  event.context.params = params;
  return h(event);
};
const status = (h: Handler, params: Record<string, string>) =>
  Promise.resolve(call(h, "", params)).then(
    () => 200,
    (e: { status?: number }) => e.status,
  );

describe("catalog browse routes", () => {
  it("lists categories with paging fields", async () => {
    const page = (await call(categories, "?size=10")) as { items: unknown[]; size: number };
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.size).toBe(10);
  });

  it("returns a category, a product and a product's items", async () => {
    expect(JSON.stringify(await call(category, "", { categoryId: "BR" }))).toContain("Br");
    expect(JSON.stringify(await call(product, "", { productId: "BR-1" }))).toContain("Brook");
    expect(JSON.stringify(await call(items, "", { productId: "BR-1" }))).toContain("BR-I");
  });

  it("answers 404 for an unknown category or product", async () => {
    expect(await status(category, { categoryId: "NOPE" })).toBe(404);
    expect(await status(product, { productId: "NOPE" })).toBe(404);
  });

  it("searches by q and by keyword", async () => {
    expect(JSON.stringify(await call(search, "?q=trout"))).toContain("BR-I");
    expect(JSON.stringify(await call(search, "?keyword=trout"))).toContain("BR-I");
    expect(await call(search, "")).toMatchObject({ items: [] });
  });
});
