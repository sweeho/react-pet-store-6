import type { Database } from "bun:sqlite";

import type { PurchaseOrder } from "../documents/purchase-order";
import { call, loadApp } from "../customers/testHarness";

export { call };

export const SHIPPING = {
  givenName: "ABC",
  familyName: "XYZ",
  street: "1 Main St",
  city: "Palo Alto",
  state: "CA",
  country: "USA",
  zip: "94303",
  email: "abc@xyz.com",
  phone: "555-555-5555",
};

/** A purchase order with one line per `[itemId, quantity]` pair, numbered from 1. */
export function purchaseOrder(
  orderId: string,
  lines: [string, number][] = [
    ["EST-1", 2],
    ["EST-6", 1],
  ],
): PurchaseOrder {
  return {
    orderId,
    userId: "j2ee",
    email: "abc@xyz.com",
    locale: "en_US",
    orderDate: 1_000_000_000_000,
    total: 3000,
    billing: SHIPPING,
    shipping: SHIPPING,
    card: { cardNumber: "4111111111111111", cardType: "Java(TM) Card", expiryDate: "12/2005" },
    lines: lines.map(([itemId, quantity], i) => ({
      lineNumber: i + 1,
      categoryId: "FISH",
      productId: "FI-SW-01",
      itemId,
      quantity,
      unitPrice: 1000,
    })),
  };
}

export const count = (client: Database, table: string, where = "1=1") =>
  (client.query(`select count(*) n from ${table} where ${where}`).get() as { n: number }).n;

export const ORDER_TABLES = [
  "op_purchase_orders",
  "op_po_contacts",
  "op_po_cards",
  "op_po_line_items",
];

/** An app with one catalog item (EST-1), signed-in customer j2ee and a helper that adds it and places an order. */
export async function shopper() {
  const app = await loadApp();
  app.client.exec(`
    insert into catalog_categories (category_id) values ('FISH');
    insert into catalog_products (product_id, category_id) values ('FI-SW-01', 'FISH');
    insert into catalog_product_details values ('FI-SW-01', 'en_US', 'Angelfish', 'p', 'p.gif');
    insert into catalog_items (item_id, product_id) values ('EST-1', 'FI-SW-01');
    insert into catalog_item_details (item_id, locale, description, image, list_price, unit_cost)
      values ('EST-1', 'en_US', 'Large Angelfish', 'i.gif', 1650, 1000);
    insert into signon_users (user_id, password_hash)
      values ('j2ee', '${await Bun.password.hash("j2ee")}');
  `);
  const signed = await call(app, "session/sign-in.post", {
    method: "POST",
    url: "/api/session/sign-in",
    json: { userId: "j2ee", password: "j2ee", remember: false },
  });
  const sid =
    signed.setCookies
      .find((c) => c.startsWith("ps_sid="))
      ?.split(";")[0]
      .slice(7) ?? "";
  const cookies = { ps_sid: sid };
  const place = async () => {
    await call(app, "cart/items.post", {
      method: "POST",
      url: "/api/cart/items",
      cookies,
      json: { itemId: "EST-1" },
    });
    return call(app, "orders/index.post", {
      method: "POST",
      url: "/api/orders",
      cookies,
      json: { billing: SHIPPING, shipping: SHIPPING },
    });
  };
  return { ...app, cookies, place };
}

export const orderIdOf = (body: unknown) => (body as { orderId: string }).orderId;
