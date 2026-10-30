import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { addItem, addItemWithQuantity, lines, removeItem } from "./cart";

db.$client.exec(`
  insert into catalog_categories (category_id) values ('T');
  insert into catalog_products (product_id, category_id) values ('T-P', 'T');
  insert into catalog_product_details values ('T-P', 'en_US', 'Angelfish', 'p', 'p.gif');
  insert into catalog_product_details values ('T-P', 'ja_JP', 'エンゼル', 'p', 'p.gif');
  insert into catalog_items (item_id, product_id) values ('T-1', 'T-P');
  insert into catalog_item_details (item_id, locale, description, image, list_price, unit_cost, attr1)
    values ('T-1', 'en_US', 'Large Angelfish', 'i.gif', 1650, 1000, 'Spotted fish');
  insert into catalog_item_details (item_id, locale, description, image, list_price, unit_cost, attr1)
    values ('T-1', 'ja_JP', '大きなエンゼルフィッシュ', 'i.gif', 195100, 155100, '斑点のある魚');
`);

const cartWithItem = () => {
  const cart = new Map<string, number>();
  addItem(cart, "T-1");
  return cart;
};

describe("cart lines", () => {
  it("[SWHR2-C-0033] a new cart with no locale lists the item from the en_US details", async () => {
    expect(await lines(cartWithItem(), undefined)).toEqual([
      {
        itemId: "T-1",
        quantity: 1,
        name: "Large Angelfish",
        attribute: "Spotted fish",
        unitPrice: 1650,
      },
    ]);
  });

  it("[SWHR2-C-0034] a cart with locale ja_JP lists the item from the ja_JP details", async () => {
    expect(await lines(cartWithItem(), "ja_JP")).toEqual([
      {
        itemId: "T-1",
        quantity: 1,
        name: "大きなエンゼルフィッシュ",
        attribute: "斑点のある魚",
        unitPrice: 195100,
      },
    ]);
  });
});

describe("cart quantities", () => {
  const qtyOf = async (c: Map<string, number>) =>
    Object.fromEntries((await lines(c, "en_US")).map((l) => [l.itemId, l.quantity]));

  it("[SWHR2-C-0080] adding with quantity 5 to a cart without the item creates a line of 5", async () => {
    const c = new Map<string, number>();
    addItemWithQuantity(c, "T-1", 5);
    expect(await qtyOf(c)).toEqual({ "T-1": 5 });
  });

  it("[SWHR2-C-0081] adding with quantity 2 when the cart holds 3 sets the quantity to 2", async () => {
    const c = new Map<string, number>([["T-1", 3]]);
    addItemWithQuantity(c, "T-1", 2);
    expect(await qtyOf(c)).toEqual({ "T-1": 2 });
  });

  it("[SWHR2-C-0099] removing an item with quantity 5 removes the whole line", async () => {
    const c = new Map<string, number>([["T-1", 5]]);
    removeItem(c, "T-1");
    expect(await qtyOf(c)).toEqual({});
  });

  it("[SWHR2-C-0100] removing an item that is not in the cart is a silent no-op", async () => {
    const c = new Map<string, number>([["T-2", 1]]);
    expect(() => removeItem(c, "T-1")).not.toThrow();
    expect([...c]).toEqual([["T-2", 1]]);
  });
});
