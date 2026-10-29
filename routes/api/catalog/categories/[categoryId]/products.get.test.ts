import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../../../db/client";
import { listProducts } from "../../../../../services/catalog";
import handler from "./products.get";

const call = (qs: string) => {
  const event = new H3Event(
    new Request(`http://localhost/api/catalog/categories/PX/products${qs}`),
  );
  event.context.params = { categoryId: "PX" };
  return handler(event);
};

db.$client.exec(`
  insert into catalog_categories (category_id) values ('PX');
  insert into catalog_category_details values ('PX', 'en_US', 'Px', 'd', 'i');
  insert into catalog_products (product_id, category_id) values ('PX-1', 'PX'), ('PX-2', 'PX'), ('PX-3', 'PX');
  insert into catalog_product_details values ('PX-1', 'en_US', 'Ant', 'd', 'i'), ('PX-2', 'en_US', 'Bee', 'd', 'i'), ('PX-3', 'en_US', 'Cat', 'd', 'i');
`);

describe("GET /api/catalog/categories/[categoryId]/products", () => {
  it("[SWHR2-C-0183] returns the same page as the catalog service", async () => {
    const viaRoute = await call("?locale=en_US&size=10");
    const viaService = await listProducts("PX", "en_US", 0, 10);
    expect(JSON.parse(JSON.stringify(viaRoute))).toEqual(JSON.parse(JSON.stringify(viaService)));
    expect((viaRoute as { items: unknown[] }).items).toHaveLength(3);
  });

  it("defaults to the first two products", async () => {
    const page = (await call("")) as { items: unknown[]; hasNext: boolean };
    expect(page.items).toHaveLength(2);
    expect(page.hasNext).toBe(true);
  });

  it("[SWHR2-C-0185] reports a store failure as a 500 catalog failure", async () => {
    db.$client.exec("drop table catalog_product_details");
    const err = (await call("?start=1").then(
      () => null,
      (e: unknown) => e,
    )) as { status?: number } | null;
    expect(err?.status).toBe(500);
  });
});
