// @vitest-environment node
import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { idOf, loadCatalog, nameOf, rows, seeder } from "./harness";

const item = (id: string, product: string, descn = "d", list = 1650, unit = 1000) => ({
  id,
  product,
  details: { en_US: { descn, list, unit } },
});

describe("catalog reads", () => {
  // case: SWHR2-C-0183@v1
  it("SWHR2-C-0183: FISH products read directly from the store and through the service are identical", async () => {
    const { client, catalog } = await loadCatalog();
    const s = seeder(client);
    s.category("FISH", { en_US: "Fish" });
    s.product("FI-SW-01", "FISH", { en_US: "Angelfish" });
    s.product("FI-FW-02", "FISH", { en_US: "Koi" });
    const direct = client
      .query(
        `select p.product_id as id, d.name as name, d.description as description
           from catalog_products p
           join catalog_product_details d on d.product_id = p.product_id and d.locale = 'en_US'
          where p.category_id = 'FISH'
          order by d.name`,
      )
      .all() as { id: string; name: string; description: string }[];
    const viaService = rows(await catalog.listProducts("FISH", "en_US", 0, 10));
    expect(direct.map((r) => r.name)).toEqual(["Angelfish", "Koi"]);
    expect(viaService.map((r) => [idOf(r), nameOf(r), r.description])).toEqual(
      direct.map((r) => [r.id, r.name, r.description]),
    );
  });

  // case: SWHR2-C-0185@v1
  it("SWHR2-C-0185: an unreachable catalog store reports a catalog failure, not an empty list", async () => {
    const { client, catalog } = await loadCatalog();
    const s = seeder(client);
    s.category("FISH", { en_US: "Fish" });
    s.product("FI-SW-01", "FISH", { en_US: "Angelfish" });
    client.close();
    const err = await catalog.listProducts("FISH", "en_US").then(
      () => null,
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).name).toBe("CatalogError");
    const route = (await import("../../../routes/api/catalog/categories/[categoryId]/products.get"))
      .default;
    const event = new H3Event(
      new Request("http://localhost/api/catalog/categories/FISH/products?locale=en_US"),
    );
    event.context.params = { categoryId: "FISH" };
    const reported = await route(event).then(
      (r) => (r instanceof Response ? r.status : 200),
      (e: { status?: number; statusCode?: number }) => e.status ?? e.statusCode,
    );
    expect(reported).toBe(500);
  });

  // case: SWHR2-C-0186@v1
  it("SWHR2-C-0186: with no paging values the first 2 of 4 FISH products are returned", async () => {
    const { client, catalog } = await loadCatalog();
    const s = seeder(client);
    s.category("FISH", { en_US: "Fish" });
    for (const [id, n] of [
      ["P1", "Angelfish"],
      ["P2", "Goldfish"],
      ["P3", "Koi"],
      ["P4", "Tiger Shark"],
    ])
      s.product(id, "FISH", { en_US: n });
    const got = rows(await catalog.listProducts("FISH", "en_US")).map(nameOf);
    expect(got).toEqual(["Angelfish", "Goldfish"]);
  });

  // case: SWHR2-C-0187@v1
  it("SWHR2-C-0187: with only page size 3, products 1 through 3 are returned", async () => {
    const { client, catalog } = await loadCatalog();
    const s = seeder(client);
    s.category("FISH", { en_US: "Fish" });
    for (const [id, n] of [
      ["P1", "Angelfish"],
      ["P2", "Goldfish"],
      ["P3", "Koi"],
      ["P4", "Tiger Shark"],
    ])
      s.product(id, "FISH", { en_US: n });
    const got = rows(await catalog.listProducts("FISH", "en_US", undefined, 3)).map(nameOf);
    expect(got).toEqual(["Angelfish", "Goldfish", "Koi"]);
  });

  // case: SWHR2-C-0193@v1
  it("SWHR2-C-0193: reading FI-SW-01 in ja_JP returns the name エンゼルフィッシュ", async () => {
    const { client, catalog } = await loadCatalog();
    const s = seeder(client);
    s.category("FISH", { en_US: "Fish", ja_JP: "魚" });
    s.product("FI-SW-01", "FISH", { en_US: "Angelfish", ja_JP: "エンゼルフィッシュ" });
    const got = rows(await catalog.listProducts("FISH", "ja_JP")).map(nameOf);
    expect(got).toEqual(["エンゼルフィッシュ"]);
  });

  // case: SWHR2-C-0194@v1
  it("SWHR2-C-0194: en_US categories from 0 with page size 10 come back in name order", async () => {
    const { client, catalog } = await loadCatalog();
    const s = seeder(client);
    s.category("REPTILES", { en_US: "Reptiles" });
    s.category("BIRDS", { en_US: "Birds" });
    s.category("FISH", { en_US: "Fish" });
    const got = rows(await catalog.listCategories("en_US", 0, 10)).map(nameOf);
    expect(got).toEqual(["Birds", "Fish", "Reptiles"]);
  });

  // case: SWHR2-C-0195@v1
  it("SWHR2-C-0195: categories from position 2 with page size 2 return the 3rd and 4th by name", async () => {
    const { client, catalog } = await loadCatalog();
    const s = seeder(client);
    for (const n of ["Birds", "Cats", "Dogs", "Fish", "Reptiles"])
      s.category(n.toUpperCase(), { en_US: n });
    const got = rows(await catalog.listCategories("en_US", 2, 2)).map(nameOf);
    expect(got).toEqual(["Dogs", "Fish"]);
  });

  // case: SWHR2-C-0196@v1
  it("SWHR2-C-0196: a category with no zh_CN details is left out of the zh_CN list", async () => {
    const { client, catalog } = await loadCatalog();
    const s = seeder(client);
    s.category("REPTILES", { en_US: "Reptiles" });
    s.category("FISH", { en_US: "Fish", zh_CN: "鱼" });
    s.category("BIRDS", { en_US: "Birds", zh_CN: "鸟" });
    const got = rows(await catalog.listCategories("zh_CN", 0, 10)).map(nameOf);
    expect(got).not.toContain("Reptiles");
    expect(got).toEqual(expect.arrayContaining(["鱼", "鸟"]));
    expect(got).toHaveLength(2);
  });

  // case: SWHR2-C-0203@v1
  it("SWHR2-C-0203: a ja_JP shopper viewing EST-1 sees only the ja_JP description", async () => {
    const { client, catalog } = await loadCatalog();
    const s = seeder(client);
    s.category("FISH", { en_US: "Fish", ja_JP: "魚" });
    s.product("FI-SW-01", "FISH", { en_US: "Angelfish", ja_JP: "エンゼルフィッシュ" });
    s.item({
      id: "EST-1",
      product: "FI-SW-01",
      details: {
        en_US: { descn: "Large Angelfish", list: 1650, unit: 1000 },
        ja_JP: { descn: "大きなエンゼルフィッシュ", list: 195100, unit: 120000 },
      },
    });
    const text = JSON.stringify(await catalog.getItem("EST-1", "ja_JP"));
    expect(text).toContain("大きなエンゼルフィッシュ");
    expect(text).not.toContain("Large Angelfish");
  });

  // case: SWHR2-C-0210@v1
  it("SWHR2-C-0210: EST-1 is hidden in ja_JP when its product FI-SW-01 has no ja_JP details", async () => {
    const { client, catalog } = await loadCatalog();
    const s = seeder(client);
    s.category("FISH", { en_US: "Fish", ja_JP: "魚" });
    s.product("FI-SW-01", "FISH", { en_US: "Angelfish" });
    s.item({
      id: "EST-1",
      product: "FI-SW-01",
      details: {
        en_US: { descn: "Large Angelfish", list: 1650, unit: 1000 },
        ja_JP: { descn: "大きなエンゼルフィッシュ", list: 195100, unit: 120000 },
      },
    });
    expect(rows(await catalog.listItems("FI-SW-01", "ja_JP"))).toEqual([]);
    const looked = await catalog.getItem("EST-1", "ja_JP").catch(() => null);
    expect(looked ?? null).toBeNull();
    expect(rows(await catalog.search("大きな", "ja_JP")).map(idOf)).not.toContain("EST-1");
  });

  // case: SWHR2-C-0211@v1
  it("SWHR2-C-0211: EST-1 in en_US returns its en_US details when item and product are both localized", async () => {
    const { client, catalog } = await loadCatalog();
    const s = seeder(client);
    s.category("FISH", { en_US: "Fish" });
    s.product("FI-SW-01", "FISH", { en_US: "Angelfish" });
    s.item(item("EST-1", "FI-SW-01", "Large Angelfish", 1650, 1000));
    const got = (await catalog.getItem("EST-1", "en_US")) as Record<string, unknown>;
    expect(got.description).toBe("Large Angelfish");
    // money is held in hundredths: 16.50 is 1650, 10.00 is 1000
    expect(got.listPrice).toBe(1650);
    expect(got.unitCost ?? got.unitPrice).toBe(1000);
  });
});
