import type { Database } from "bun:sqlite";

import { seeder } from "../catalog-browsing/harness";
import { call, cookieValue, loadApp, seedCustomer } from "../sign-on/harness";

export { call, cookieValue, loadApp };

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

/** A purchase order as the order document codec and order receipt see it (money in hundredths). */
export function purchaseOrder(
  orderId: string,
  lines: [string, number][] = [
    ["EST-1", 2],
    ["EST-6", 1],
  ],
) {
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

/** An app with a catalog, signed-in customer j2ee and a helper that adds EST-1 and places an order. */
export async function shopper() {
  const app = await loadApp();
  const s = seeder(app.client);
  s.category("FISH", { en_US: "Fish" });
  s.product("FI-SW-01", "FISH", { en_US: "Angelfish" });
  s.item({
    id: "EST-1",
    product: "FI-SW-01",
    details: { en_US: { descn: "Angelfish", list: 1650, unit: 1000 } },
  });
  await seedCustomer(app.client, "j2ee", "j2ee");
  const signed = await call(app, "../../../routes/api/session/sign-in.post", {
    method: "POST",
    url: "/api/session/sign-in",
    json: { userId: "j2ee", password: "j2ee", remember: false },
  });
  const cookies = { ps_sid: cookieValue(signed.setCookies, "ps_sid") ?? "" };
  const place = async () => {
    await call(app, "../../../routes/api/cart/items.post", {
      method: "POST",
      url: "/api/cart/items",
      cookies,
      json: { itemId: "EST-1" },
    });
    return call(app, "../../../routes/api/orders/index.post", {
      method: "POST",
      url: "/api/orders",
      cookies,
      json: { billing: SHIPPING, shipping: SHIPPING },
    });
  };
  return { ...app, cookies, place };
}

export const orderIdOf = (body: unknown) =>
  (typeof body === "string" ? JSON.parse(body) : (body as { orderId: string })).orderId as string;
