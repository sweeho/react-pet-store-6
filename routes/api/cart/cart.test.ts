import { H3Event } from "nitro/h3";
import { describe, expect, it, vi } from "vitest";

interface Reply {
  status: number;
  body: unknown;
  cookie: string;
}
type Lines = { itemId: string; quantity: number }[];

/** Fresh modules (a fresh in-memory db and session store) with EST-1 and EST-2 in the en_US catalog. */
async function cartApp() {
  vi.resetModules();
  const { db } = await import("../../../db/client");
  db.$client.exec(`
    insert into catalog_categories (category_id) values ('FISH');
    insert into catalog_products (product_id, category_id) values ('FI-SW-01', 'FISH');
    insert into catalog_product_details values ('FI-SW-01', 'en_US', 'Angelfish', 'p', 'p.gif');
    insert into catalog_items (item_id, product_id) values ('EST-1', 'FI-SW-01');
    insert into catalog_items (item_id, product_id) values ('EST-2', 'FI-SW-01');
    insert into catalog_item_details (item_id, locale, description, image, list_price, unit_cost)
      values ('EST-1', 'en_US', 'Large Angelfish', 'i.gif', 1650, 1000);
    insert into catalog_item_details (item_id, locale, description, image, list_price, unit_cost)
      values ('EST-2', 'en_US', 'Small Angelfish', 'i.gif', 1650, 1000);
  `);
  return (await import("../../../middleware/10.session")).default as (e: H3Event) => unknown;
}

/** Runs the session middleware, then the route at `route` (under routes/api), as Nitro does. */
async function call(
  session: Awaited<ReturnType<typeof cartApp>>,
  route: string,
  req: { method?: string; url: string; cookie?: string; json?: unknown; params?: object },
): Promise<Reply> {
  const headers: Record<string, string> = {};
  if (req.cookie) headers.cookie = req.cookie;
  if (req.json !== undefined) headers["content-type"] = "application/json";
  const event = new H3Event(
    new Request(`http://localhost${req.url}`, {
      method: req.method ?? "GET",
      headers,
      body: req.json === undefined ? undefined : JSON.stringify(req.json),
    }),
  );
  if (req.params) event.context.params = req.params as Record<string, string>;
  await session(event);
  const handler = (await import(/* @vite-ignore */ `../../../routes/api/${route}`)).default as (
    e: H3Event,
  ) => Promise<unknown>;
  const cookie = (event.res.headers.getSetCookie()[0] ?? "").split(";")[0] ?? "";
  try {
    return { status: 200, body: await handler(event), cookie };
  } catch (err) {
    const e = err as { status?: number; data?: unknown };
    return { status: e.status ?? 500, body: e.data, cookie };
  }
}

const getCart = (s: Awaited<ReturnType<typeof cartApp>>, cookie?: string) =>
  call(s, "cart/index.get", { url: "/api/cart", cookie });
const addToCart = (
  s: Awaited<ReturnType<typeof cartApp>>,
  cookie: string,
  itemId: string,
  quantity?: number,
) =>
  call(s, "cart/items.post", {
    method: "POST",
    url: "/api/cart/items",
    cookie,
    json: { itemId, quantity },
  });
const removeFromCart = (s: Awaited<ReturnType<typeof cartApp>>, cookie: string, itemId: string) =>
  call(s, "cart/items/[itemId].delete", {
    method: "DELETE",
    url: `/api/cart/items/${itemId}`,
    cookie,
    params: { itemId },
  });
const lines = (r: Reply) => (r.body as { lines: Lines }).lines;
const ids = (r: Reply) => lines(r).map((l) => l.itemId);
const qty = (r: Reply, id: string) => lines(r).find((l) => l.itemId === id)?.quantity;
const sessionOf = async (s: Awaited<ReturnType<typeof cartApp>>) => (await getCart(s)).cookie;

describe("cart routes", () => {
  it("[SWHR2-C-0083] a new session gets an empty cart view with a total", async () => {
    const app = await cartApp();
    const r = await getCart(app);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ locale: "en_US", lines: [], total: 0 });
    expect(r.cookie).toMatch(/^ps_sid=/);
  });

  it("[SWHR2-C-0096] adding without a quantity sets 1 and returns the full view", async () => {
    const app = await cartApp();
    const cookies = await sessionOf(app);
    const r = await addToCart(app, cookies, "EST-1");
    expect(r.status).toBe(200);
    expect(qty(r, "EST-1")).toBe(1);
    expect((r.body as { total: number }).total).toBe(1650);
  });

  it("[SWHR2-C-0081] adding with a quantity replaces the existing one", async () => {
    const app = await cartApp();
    const cookies = await sessionOf(app);
    await addToCart(app, cookies, "EST-1", 3);
    expect(qty(await addToCart(app, cookies, "EST-1", 2), "EST-1")).toBe(2);
  });

  it("[SWHR2-C-0098] removing a line returns the view without it, and an absent item is a no-op", async () => {
    const app = await cartApp();
    const cookies = await sessionOf(app);
    await addToCart(app, cookies, "EST-1", 4);
    await addToCart(app, cookies, "EST-2");
    expect(ids(await removeFromCart(app, cookies, "EST-1"))).toEqual(["EST-2"]);
    const again = await removeFromCart(app, cookies, "EST-1");
    expect(again.status).toBe(200);
    expect(ids(again)).toEqual(["EST-2"]);
  });

  it("[SWHR2-C-0086] Update Cart sets quantities and returns the totals", async () => {
    const app = await cartApp();
    const cookies = await sessionOf(app);
    await addToCart(app, cookies, "EST-1");
    const r = await call(app, "cart/index.put", {
      method: "PUT",
      url: "/api/cart",
      cookie: cookies,
      json: { quantities: { "EST-1": 2 } },
    });
    expect(r.status).toBe(200);
    expect(qty(r, "EST-1")).toBe(2);
    expect((r.body as { total: number }).total).toBe(3300);
  });

  it("[SWHR2-C-0086] Update Cart rejects a body without quantities", async () => {
    const app = await cartApp();
    const cookies = await sessionOf(app);
    const r = await call(app, "cart/index.put", {
      method: "PUT",
      url: "/api/cart",
      cookie: cookies,
      json: {},
    });
    expect(r.status).toBe(400);
  });

  it("[SWHR2-C-0084] two sessions have separate carts", async () => {
    const app = await cartApp();
    const a = await sessionOf(app);
    const b = await sessionOf(app);
    await addToCart(app, a, "EST-1");
    expect(ids(await getCart(app, b))).toEqual([]);
  });

  it("[SWHR2-C-0093] [SWHR2-C-0094] an anonymous visitor adds and removes EST-1 with no role check", async () => {
    const app = await cartApp();
    const cookies = await sessionOf(app);
    const added = await addToCart(app, cookies, "EST-1");
    expect(added.status).toBe(200);
    expect(qty(added, "EST-1")).toBe(1);
    const removed = await removeFromCart(app, cookies, "EST-1");
    expect(removed.status).toBe(200);
    expect(ids(removed)).toEqual([]);
  });

  it("[SWHR2-C-0085] [SWHR2-C-0095] signing out discards the cart for every later session", async () => {
    const app = await cartApp();
    const s1 = await sessionOf(app);
    await addToCart(app, s1, "EST-1", 2);
    await call(app, "session/sign-out.post", {
      method: "POST",
      url: "/api/session/sign-out",
      cookie: s1,
    });
    expect(ids(await getCart(app, s1))).toEqual([]);
    expect(ids(await getCart(app))).toEqual([]);
  });
});
