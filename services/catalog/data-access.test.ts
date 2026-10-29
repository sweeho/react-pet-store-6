// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { db } from "../../db/client";
import { registerDataAccess, type DataAccess } from "./data-access";
import { catalogDialect, listProducts } from "./index";

db.$client.exec(`
  insert into catalog_categories (category_id) values ('FISH');
  insert into catalog_products (product_id, category_id) values ('FI-SW-01', 'FISH'), ('FI-FW-02', 'FISH');
  insert into catalog_product_details values ('FI-SW-01', 'en_US', 'Angelfish', 'd', 'p.gif');
  insert into catalog_product_details values ('FI-FW-02', 'en_US', 'Koi', 'd', 'p.gif');
`);

function recorder(label: string, calls: string[]): DataAccess {
  return {
    dialect: "sqlite",
    listCategories: async () => [],
    getCategory: async () => undefined,
    listProducts: async (categoryId: string) => {
      calls.push(`${label}:${categoryId}`);
      return [{ productId: "X", categoryId, name: label, description: "", image: "" }];
    },
    getProduct: async () => undefined,
    listItems: async () => [],
    getItem: async () => undefined,
  };
}

afterEach(() => vi.unstubAllEnvs());

describe("catalog data-access seam", () => {
  it("[SWHR2-C-0280] reads go through the implementation named in the configuration", async () => {
    const calls: string[] = [];
    registerDataAccess("recording", recorder("recording", calls));
    vi.stubEnv("CATALOG_DATA_ACCESS", "recording");
    const page = await listProducts("FISH", "en_US");
    expect(calls).toEqual(["recording:FISH"]);
    expect(page.items.map((p) => p.name)).toEqual(["recording"]);
  });

  it("[SWHR2-C-0281] reads use the dialect named in the configuration", async () => {
    vi.stubEnv("CATALOG_DATA_ACCESS", "drizzle");
    vi.stubEnv("CATALOG_DB_DIALECT", "sqlite");
    const page = await listProducts("FISH", "en_US", 0, 10);
    expect(page.items.map((p) => p.name)).toEqual(["Angelfish", "Koi"]);
    expect(catalogDialect()).toBe("sqlite");
  });

  it("[SWHR2-C-0282] changing only the configured implementation changes which one serves reads", async () => {
    const a: string[] = [];
    const b: string[] = [];
    registerDataAccess("impl-a", recorder("A", a));
    registerDataAccess("impl-b", recorder("B", b));
    vi.stubEnv("CATALOG_DATA_ACCESS", "impl-a");
    await listProducts("FISH", "en_US");
    vi.stubEnv("CATALOG_DATA_ACCESS", "impl-b");
    await listProducts("FISH", "en_US");
    expect(a).toEqual(["A:FISH"]);
    expect(b).toEqual(["B:FISH"]);
  });
});
