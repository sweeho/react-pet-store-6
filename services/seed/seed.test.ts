// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import type { SeedData } from "../../db/seed/types";

const file = () =>
  JSON.parse(readFileSync(path.join(process.cwd(), "db/seed/petstore.json"), "utf8")) as SeedData;

const L = ["en_US", "ja_JP", "zh_CN"] as const;
const byLocale = <T>(v: T) =>
  Object.fromEntries(L.map((l) => [l, v])) as Record<(typeof L)[number], T>;

/** A one-product seed data set. */
function mini(): SeedData {
  return {
    users: [],
    customers: [],
    categories: [
      { id: "TEST-C1", details: byLocale({ name: "C", description: "C", image: "c.gif" }) },
    ],
    products: [
      {
        id: "TEST-P1",
        categoryId: "TEST-C1",
        details: byLocale({ name: "Test Product", description: "d", image: "p.gif" }),
      },
    ],
    items: [
      {
        id: "TEST-I1",
        productId: "TEST-P1",
        details: byLocale({
          description: "d",
          image: "i.gif",
          listPrice: 100,
          unitCost: 50,
          attributes: ["a"],
        }),
      },
    ],
    inventory: [{ itemId: "TEST-I1" }],
  };
}

async function load() {
  vi.resetModules();
  const { db } = await import("../../db/client");
  const client = db.$client as unknown as import("bun:sqlite").Database;
  const seed = await import("../../scripts/seed");
  const n = (table: string, where = "1=1") =>
    (client.query(`select count(*) n from ${table} where ${where}`).get() as { n: number }).n;
  return { db, client, seed, n };
}

describe("seed loader", () => {
  it("[SWHR2-C-0075] loads 4 users and customers, 5 categories, 16 products, 28 items in en, ja and zh", async () => {
    const { seed, n } = await load();
    await seed.loadSeed();
    expect([n("signon_users"), n("customers"), n("catalog_categories")]).toEqual([4, 4, 5]);
    expect([n("catalog_products"), n("catalog_items")]).toEqual([16, 28]);
    for (const l of ["en_US", "ja_JP", "zh_CN"])
      expect(n("catalog_item_details", `locale='${l}'`)).toBe(28);
    expect(n("catalog_product_details")).toBe(48);
    expect(n("catalog_category_details")).toBe(15);
  });

  it("[SWHR2-C-0073] seeds EST-1 to EST-29 at 10000", async () => {
    const { seed, n } = await load();
    await seed.loadSeed();
    expect(n("sup_inventory")).toBe(29);
    expect(n("sup_inventory", "quantity = 10000")).toBe(29);
  });

  it("[SWHR2-C-0074] seeds an entry without a quantity at 0", async () => {
    const { seed, db, client } = await load();
    seed.seedInventory(db, [{ itemId: "EST-99" }]);
    expect(client.query("select quantity from sup_inventory where item_id='EST-99'").get()).toEqual(
      { quantity: 0 },
    );
  });

  it("[SWHR2-C-0070] fills catalog, customer and inventory data into an empty datastore", async () => {
    const { seed, n } = await load();
    await seed.loadSeed();
    const data = file();
    expect([n("catalog_products"), n("customers"), n("sup_inventory")]).toEqual([
      data.products.length,
      data.customers.length,
      data.inventory.length,
    ]);
  });

  it("[SWHR2-C-0071] a product added to the seed data is present after loading", async () => {
    const { seed, n } = await load();
    await seed.loadSeed(mini());
    expect(n("catalog_products", "product_id='TEST-P1'")).toBe(1);
    expect(n("catalog_product_details", "product_id='TEST-P1'")).toBe(3);
  });

  it("[SWHR2-C-0076] re-seeding restores j2ee and keeps a non-sample account", async () => {
    const { seed, client, n } = await load();
    await seed.loadSeed();
    client.exec(
      "update contact_info set email='edited@example.com' where id=(select contact_id from customer_accounts where user_id='j2ee')",
    );
    client.exec(
      "insert into signon_users (user_id, password_hash) values ('alice','h'); insert into customers (user_id) values ('alice')",
    );
    await seed.loadSeed();
    const email = client
      .query(
        "select c.email e from customer_accounts a join contact_info c on c.id=a.contact_id where a.user_id='j2ee'",
      )
      .get() as { e: string };
    expect(email.e).toBe("aaa@bbb.ccc");
    expect(n("customers", "user_id='alice'")).toBe(1);
    expect(n("customers")).toBe(5);
  });

  it("writes nothing when the seed data is malformed", async () => {
    const { seed, n } = await load();
    const data = mini();
    data.items[0].productId = "NO-SUCH-PRODUCT";
    await expect(seed.loadSeed(data)).rejects.toThrow();
    expect([n("catalog_categories"), n("signon_users"), n("sup_inventory")]).toEqual([0, 0, 0]);
  });
});
