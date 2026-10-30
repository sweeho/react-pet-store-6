import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import {
  addItem,
  addItemWithQuantity,
  cartTotal,
  clear,
  lines,
  removeItem,
  updateQuantities,
} from "./cart";

db.$client.exec(`
  insert into catalog_categories (category_id) values ('T');
  insert into catalog_products (product_id, category_id) values ('T-P', 'T');
  insert into catalog_product_details values ('T-P', 'en_US', 'Angelfish', 'p', 'p.gif');
  insert into catalog_product_details values ('T-P', 'ja_JP', 'エンゼル', 'p', 'p.gif');
  insert into catalog_items (item_id, product_id) values ('T-1', 'T-P');
  insert into catalog_items (item_id, product_id) values ('T-2', 'T-P');
  insert into catalog_items (item_id, product_id) values ('T-3', 'T-P');
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

const cartOf = (entries: [string, number][]) => new Map<string, number>(entries);
const idsOf = async (cart: Map<string, number>) =>
  (await lines(cart, "en_US")).map((l) => l.itemId);

describe("cart operations", () => {
  it("[SWHR2-C-0080] adding an item with quantity 5 creates a line with quantity 5", async () => {
    const cart = cartOf([["T-2", 1]]);
    addItemWithQuantity(cart, "T-1", 5);
    expect(cart.get("T-1")).toBe(5);
    expect(cart.get("T-2")).toBe(1);
  });

  it("[SWHR2-C-0081] adding with quantity 2 replaces an existing quantity of 3", async () => {
    const cart = cartOf([["T-1", 3]]);
    addItemWithQuantity(cart, "T-1", 2);
    expect([...cart]).toEqual([["T-1", 2]]);
  });

  it("[SWHR2-C-0082] listing three items returns each line exactly once", async () => {
    const cart = new Map<string, number>();
    for (const id of ["T-1", "T-2", "T-3"]) {
      addItem(cart, id);
      expect(cart.get(id)).toBe(1);
    }
    expect(new Set(cart.keys())).toEqual(new Set(["T-1", "T-2", "T-3"]));
    expect(cart.size).toBe(3);
    expect(await idsOf(cartOf([["T-1", 1]]))).toEqual(["T-1"]);
  });

  it("[SWHR2-C-0099] deleting an item with quantity 5 removes the whole line", async () => {
    const cart = cartOf([
      ["T-1", 5],
      ["T-2", 1],
    ]);
    removeItem(cart, "T-1");
    expect([...cart]).toEqual([["T-2", 1]]);
  });

  it("[SWHR2-C-0100] deleting an item that is not in the cart is a silent no-op", async () => {
    const cart = cartOf([["T-2", 1]]);
    expect(() => removeItem(cart, "T-1")).not.toThrow();
    expect([...cart]).toEqual([["T-2", 1]]);
  });

  it("re-adding sets the quantity to 1; update, clear and total work", async () => {
    const cart = cartOf([["T-1", 3]]);
    addItem(cart, "T-1");
    expect(cart.get("T-1")).toBe(1);
    updateQuantities(cart, { "T-1": 4 });
    expect(await cartTotal(cart, "en_US")).toBe(4 * 1650);
    clear(cart);
    expect(cart.size).toBe(0);
  });
});
