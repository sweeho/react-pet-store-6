import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import {
  addItem,
  addItemWithQuantity,
  cartFor,
  clearCart,
  lines,
  removeItem,
  total,
  updateQuantities,
} from "./cart";

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
        productName: "Angelfish",
        unitPrice: 1650,
        lineTotal: 1650,
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
        productName: "エンゼル",
        unitPrice: 195100,
        lineTotal: 195100,
      },
    ]);
  });
});

describe("cart model", () => {
  it("[SWHR2-C-0080] adding T-1 x 5 to a cart without it creates a line with quantity 5", async () => {
    const cart = new Map<string, number>();
    addItemWithQuantity(cart, "T-1", 5);
    expect((await lines(cart, "en_US")).map((l) => [l.itemId, l.quantity])).toEqual([["T-1", 5]]);
  });

  it("[SWHR2-C-0081] adding T-1 x 2 when the cart holds 3 sets the quantity to 2", () => {
    const cart = new Map([["T-1", 3]]);
    addItemWithQuantity(cart, "T-1", 2);
    expect([...cart]).toEqual([["T-1", 2]]);
  });

  it("[SWHR2-C-0081] adding an item again sets its quantity to 1", () => {
    const cart = new Map([["T-1", 3]]);
    addItem(cart, "T-1");
    expect(cart.get("T-1")).toBe(1);
  });

  it("[SWHR2-C-0082] listing a cart returns each line once with its line total and the cart total", async () => {
    const cart = new Map([["T-1", 3]]);
    const view = await lines(cart, "en_US");
    expect(view).toHaveLength(1);
    expect(view[0]).toMatchObject({ productName: "Angelfish", lineTotal: 4950 });
    expect(total(view)).toBe(4950);
  });

  it("[SWHR2-C-0099] removing T-1 x 5 removes the whole line", () => {
    const cart = new Map([
      ["T-1", 5],
      ["T-2", 1],
    ]);
    removeItem(cart, "T-1");
    expect([...cart]).toEqual([["T-2", 1]]);
  });

  it("[SWHR2-C-0100] removing an absent item is a silent no-op", () => {
    const cart = new Map([["T-2", 1]]);
    expect(() => removeItem(cart, "T-1")).not.toThrow();
    expect([...cart]).toEqual([["T-2", 1]]);
  });

  it("[SWHR2-C-0081] updateQuantities sets quantities and removes lines set to zero or less", () => {
    const cart = new Map([
      ["T-1", 3],
      ["T-2", 1],
    ]);
    updateQuantities(cart, { "T-1": 7, "T-2": 0, "T-3": -1 });
    expect([...cart]).toEqual([["T-1", 7]]);
  });

  it("clearCart empties the session's cart", () => {
    cartFor("s1").set("T-1", 1);
    clearCart("s1");
    expect(cartFor("s1").size).toBe(0);
  });
});
