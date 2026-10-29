// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { getItem, listCategories, listItems, listProducts, search } from "./index";

const client = db.$client;
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

function category(id: string, names: Record<string, string>) {
  client.exec(`insert into catalog_categories (category_id) values (${q(id)})`);
  for (const [loc, name] of Object.entries(names))
    client.exec(
      `insert into catalog_category_details values (${q(id)}, ${q(loc)}, ${q(name)}, ${q(name)}, 'c.gif')`,
    );
}
function product(id: string, cat: string, names: Record<string, string>) {
  client.exec(
    `insert into catalog_products (product_id, category_id) values (${q(id)}, ${q(cat)})`,
  );
  for (const [loc, name] of Object.entries(names))
    client.exec(
      `insert into catalog_product_details values (${q(id)}, ${q(loc)}, ${q(name)}, 'd', 'p.gif')`,
    );
}
function item(id: string, prod: string, details: Record<string, [string, number, number]>) {
  client.exec(`insert into catalog_items (item_id, product_id) values (${q(id)}, ${q(prod)})`);
  for (const [loc, [descn, list, unit]] of Object.entries(details))
    client.exec(
      `insert into catalog_item_details (item_id, locale, description, image, list_price, unit_cost) values (${q(id)}, ${q(loc)}, ${q(descn)}, 'i.gif', ${list}, ${unit})`,
    );
}

beforeEach(() => {
  for (const t of [
    "catalog_item_details",
    "catalog_items",
    "catalog_product_details",
    "catalog_products",
    "catalog_category_details",
    "catalog_categories",
  ])
    client.exec(`delete from ${t}`);
});

const names = (r: { items: { name: string }[] }) => r.items.map((i) => i.name);

describe("catalog queries", () => {
  it("[SWHR2-C-0193] reading FI-SW-01 in ja_JP returns the name エンゼルフィッシュ", async () => {
    category("FISH", { en_US: "Fish", ja_JP: "魚" });
    product("FI-SW-01", "FISH", { en_US: "Angelfish", ja_JP: "エンゼルフィッシュ" });
    expect(names(await listProducts("FISH", "ja_JP"))).toEqual(["エンゼルフィッシュ"]);
  });

  it("[SWHR2-C-0194] en_US categories from 0 with page size 10 come back in name order", async () => {
    category("REPTILES", { en_US: "Reptiles" });
    category("BIRDS", { en_US: "Birds" });
    category("FISH", { en_US: "Fish" });
    expect(names(await listCategories("en_US", 0, 10))).toEqual(["Birds", "Fish", "Reptiles"]);
  });

  it("[SWHR2-C-0195] categories from position 2 with page size 2 return the 3rd and 4th by name", async () => {
    for (const n of ["Birds", "Cats", "Dogs", "Fish", "Reptiles"])
      category(n.toUpperCase(), { en_US: n });
    expect(names(await listCategories("en_US", 2, 2))).toEqual(["Dogs", "Fish"]);
  });

  it("[SWHR2-C-0196] a category with no zh_CN details is left out of the zh_CN list", async () => {
    category("REPTILES", { en_US: "Reptiles" });
    category("FISH", { en_US: "Fish", zh_CN: "鱼" });
    category("BIRDS", { en_US: "Birds", zh_CN: "鸟" });
    expect(names(await listCategories("zh_CN", 0, 10))).toEqual(["鱼", "鸟"]);
  });

  it("[SWHR2-C-0203] a ja_JP shopper viewing EST-1 sees only the ja_JP description", async () => {
    category("FISH", { en_US: "Fish", ja_JP: "魚" });
    product("FI-SW-01", "FISH", { en_US: "Angelfish", ja_JP: "エンゼルフィッシュ" });
    item("EST-1", "FI-SW-01", {
      en_US: ["Large Angelfish", 1650, 1000],
      ja_JP: ["大きなエンゼルフィッシュ", 195100, 120000],
    });
    const text = JSON.stringify(await getItem("EST-1", "ja_JP"));
    expect(text).toContain("大きなエンゼルフィッシュ");
    expect(text).not.toContain("Large Angelfish");
  });

  it("[SWHR2-C-0210] EST-1 is hidden in ja_JP when its product has no ja_JP details", async () => {
    category("FISH", { en_US: "Fish", ja_JP: "魚" });
    product("FI-SW-01", "FISH", { en_US: "Angelfish" });
    item("EST-1", "FI-SW-01", {
      en_US: ["Large Angelfish", 1650, 1000],
      ja_JP: ["大きなエンゼルフィッシュ", 195100, 120000],
    });
    expect((await listItems("FI-SW-01", "ja_JP")).items).toEqual([]);
    expect(await getItem("EST-1", "ja_JP")).toBeUndefined();
    expect((await search("大きな", "ja_JP")).items).toEqual([]);
  });

  it("[SWHR2-C-0211] EST-1 in en_US returns its en_US details when item and product are both localized", async () => {
    category("FISH", { en_US: "Fish" });
    product("FI-SW-01", "FISH", { en_US: "Angelfish" });
    item("EST-1", "FI-SW-01", { en_US: ["Large Angelfish", 1650, 1000] });
    expect(await getItem("EST-1", "en_US")).toMatchObject({
      itemId: "EST-1",
      productId: "FI-SW-01",
      description: "Large Angelfish",
      listPrice: 1650,
      unitCost: 1000,
    });
  });

  it("a store failure is reported as CatalogError, never an empty list", async () => {
    // Table dropped inside a transaction that is rolled back.
    client.exec("begin");
    client.exec("alter table catalog_products rename to catalog_products_x");
    try {
      const err = await listProducts("FISH", "en_US").then(
        () => null,
        (e: unknown) => e,
      );
      expect((err as Error | null)?.name).toBe("CatalogError");
    } finally {
      client.exec("rollback");
    }
  });
});
