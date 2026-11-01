import type { Database } from "bun:sqlite";
import { H3Event } from "nitro/h3";
import { expect, it, vi } from "vitest";

/** Test support for checkout: a fresh app (db and sessions), a request runner and a signed-in shopper. */
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

export const ORDER_TABLES = [
  "op_purchase_orders",
  "op_po_contacts",
  "op_po_cards",
  "op_po_line_items",
];

export const count = (client: Database, table: string, where = "1=1") =>
  (client.query(`select count(*) n from ${table} where ${where}`).get() as { n: number }).n;

export async function loadApp() {
  vi.resetModules();
  const { db } = await import("../../db/client");
  const client = db.$client as unknown as Database;
  const session = (await import("../../middleware/10.session")).default as (e: H3Event) => unknown;
  return { db, client, session };
}

export interface Reply {
  status: number;
  body: unknown;
  setCookies: string[];
}

/** Runs the session middleware, then the route at `route` (under routes/api), as Nitro does. */
export async function call(
  app: Awaited<ReturnType<typeof loadApp>>,
  route: string,
  req: { method?: string; url: string; cookies?: Record<string, string>; json?: unknown },
): Promise<Reply> {
  const headers: Record<string, string> = {};
  if (req.cookies)
    headers.cookie = Object.entries(req.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  if (req.json !== undefined) headers["content-type"] = "application/json";
  const event = new H3Event(
    new Request(`http://localhost${req.url}`, {
      method: req.method ?? "GET",
      headers,
      body: req.json === undefined ? undefined : JSON.stringify(req.json),
    }),
  );
  await app.session(event);
  const handler = (await import(/* @vite-ignore */ `../../routes/api/${route}`)).default as (
    e: H3Event,
  ) => Promise<unknown>;
  let out: unknown;
  let status = 200;
  try {
    out = await handler(event);
  } catch (err) {
    const e = err as { status?: number; statusCode?: number };
    status = e.status ?? e.statusCode ?? 500;
    out = err;
  }
  return { status, body: out, setCookies: event.res.headers.getSetCookie?.() ?? [] };
}

export function cookieValue(setCookies: string[], name: string) {
  const c = setCookies.find((s) => s.startsWith(`${name}=`));
  return c ? c.slice(name.length + 1).split(";")[0] : undefined;
}

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
    billing: { ...SHIPPING },
    shipping: { ...SHIPPING },
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

/** An app with an Angelfish catalog (EST-1, EST-2) and customer j2ee signed in; `place` adds EST-1 and orders. */
export async function shopper() {
  const app = await loadApp();
  app.client.exec(`
    insert into catalog_categories (category_id) values ('FISH');
    insert into catalog_products (product_id, category_id) values ('FI-SW-01', 'FISH');
    insert into catalog_product_details values ('FI-SW-01', 'en_US', 'Angelfish', 'p', 'p.gif');
    insert into catalog_items (item_id, product_id) values ('EST-1', 'FI-SW-01');
    insert into catalog_item_details (item_id, locale, description, image, list_price, unit_cost)
      values ('EST-1', 'en_US', 'Angelfish', 'i.gif', 1000, 1000);
  `);
  const hash = await Bun.password.hash("j2ee");
  app.client.exec(
    `insert or replace into signon_users (user_id, password_hash) values ('j2ee', '${hash}')`,
  );
  const signed = await signIn(app, "j2ee", "j2ee");
  const cookies = { ps_sid: cookieValue(signed.setCookies, "ps_sid") ?? "" };
  const addItem = (c = cookies) =>
    call(app, "cart/items.post", {
      method: "POST",
      url: "/api/cart/items",
      cookies: c,
      json: { itemId: "EST-1" },
    });
  const order = (c = cookies, json: unknown = { billing: SHIPPING, shipping: SHIPPING }) =>
    call(app, "orders/index.post", { method: "POST", url: "/api/orders", cookies: c, json });
  const place = async () => {
    await addItem();
    return order();
  };
  return { ...app, cookies, addItem, order, place };
}

export const signIn = (
  app: Awaited<ReturnType<typeof loadApp>>,
  userId: string,
  password: string,
) =>
  call(app, "session/sign-in.post", {
    method: "POST",
    url: "/api/session/sign-in",
    json: { userId, password, remember: false },
  });

export const orderIdOf = (body: unknown) => (body as { orderId: string }).orderId;

// Vitest runs this file because it is a test file; it only checks the fixture the other tests share.
it("builds a two-line purchase order", () => {
  expect(purchaseOrder("10011").lines).toHaveLength(2);
});
