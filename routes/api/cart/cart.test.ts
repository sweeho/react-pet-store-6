import { H3Event } from "nitro/h3";
import { beforeEach, describe, expect, it, vi } from "vitest";

type Cookies = Record<string, string>;
interface App {
  session: (e: H3Event) => unknown;
  client: import("bun:sqlite").Database;
}

let app: App;

async function cartApp(): Promise<App> {
  vi.resetModules();
  const { db } = await import("../../../db/client");
  const client = db.$client as unknown as import("bun:sqlite").Database;
  client.exec(`
    insert or ignore into catalog_categories (category_id) values ('FISH');
    insert or ignore into catalog_products (product_id, category_id) values ('FI-SW-01', 'FISH');
    insert or ignore into catalog_product_details values ('FI-SW-01', 'en_US', 'Angelfish', 'p', 'p.gif');
  `);
  for (const [id, name] of [
    ["EST-1", "Large Angelfish"],
    ["EST-2", "Small Angelfish"],
  ]) {
    client.exec(`
      insert or ignore into catalog_items (item_id, product_id) values ('${id}', 'FI-SW-01');
      insert or ignore into catalog_item_details (item_id, locale, description, image, list_price, unit_cost)
        values ('${id}', 'en_US', '${name}', 'i.gif', 1650, 1650);
    `);
  }
  const session = (await import("../../../middleware/10.session")).default as App["session"];
  return { session, client };
}

interface Reply {
  status: number;
  body: unknown;
  setCookies: string[];
}

async function call(
  route: string,
  req: { method?: string; url: string; cookies?: Cookies; json?: unknown; params?: Cookies },
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
  if (req.params) event.context.params = req.params;
  await app.session(event);
  const handler = (await import(/* @vite-ignore */ `../../../routes/api/${route}`)).default as (
    e: H3Event,
  ) => Promise<unknown>;
  let body: unknown;
  let status = 200;
  try {
    body = await handler(event);
  } catch (err) {
    const e = err as { status?: number; statusCode?: number };
    status = e.status ?? e.statusCode ?? 500;
    body = err;
  }
  return { status, body, setCookies: event.res.headers.getSetCookie?.() ?? [] };
}

const cookieOf = (r: Reply, name: string) =>
  r.setCookies
    .find((c) => c.startsWith(`${name}=`))
    ?.split(";")[0]
    .slice(name.length + 1);
const sessionOf = (r: Reply): Cookies => ({ ps_sid: cookieOf(r, "ps_sid") ?? "" });

const getCart = (cookies?: Cookies) => call("cart/index.get", { url: "/api/cart", cookies });
const addToCart = (cookies: Cookies, itemId: string, quantity?: number) =>
  call("cart/items.post", {
    method: "POST",
    url: "/api/cart/items",
    cookies,
    json: { itemId, quantity },
  });
const removeFromCart = (cookies: Cookies, itemId: string) =>
  call("cart/items/[itemId].delete", {
    method: "DELETE",
    url: `/api/cart/items/${itemId}`,
    cookies,
    params: { itemId },
  });

const linesOf = (view: unknown) =>
  (view as { lines: { itemId: string; quantity: number }[] }).lines;
const ids = (view: unknown) => linesOf(view).map((l) => l.itemId);
const qty = (view: unknown, id: string) => linesOf(view).find((l) => l.itemId === id)?.quantity;

beforeEach(async () => {
  app = await cartApp();
});

describe("cart routes", () => {
  it("[SWHR2-C-0083] opening the cart in a new session creates an empty cart", async () => {
    const r = await getCart();
    expect(r.status).toBe(200);
    expect(ids(r.body)).toEqual([]);
    expect((r.body as { total: number }).total).toBe(0);
    const cookies = sessionOf(r);
    await addToCart(cookies, "EST-1");
    expect(ids((await getCart(cookies)).body)).toEqual(["EST-1"]);
  });

  it("[SWHR2-C-0094] a visitor who has not signed on can remove EST-1", async () => {
    const cookies = sessionOf(await getCart());
    await addToCart(cookies, "EST-1");
    const r = await removeFromCart(cookies, "EST-1");
    expect(r.status).toBe(200);
    expect(ids((await getCart(cookies)).body)).not.toContain("EST-1");
  });

  it("[SWHR2-C-0095] after a session ends its cart cannot be retrieved", async () => {
    const s1 = sessionOf(await getCart());
    await addToCart(s1, "EST-1", 2);
    expect(qty((await getCart(s1)).body, "EST-1")).toBe(2);
    await call("session/sign-out.post", {
      method: "POST",
      url: "/api/session/sign-out",
      cookies: s1,
    });
    expect(ids((await getCart(s1)).body)).toEqual([]);
    const s2 = await getCart();
    expect(JSON.stringify(s2.body)).not.toContain("EST-1");
  });

  it("[SWHR2-C-0098] removing EST-1 from a cart holding EST-1 and EST-2 leaves only EST-2", async () => {
    const cookies = sessionOf(await getCart());
    await addToCart(cookies, "EST-1");
    await addToCart(cookies, "EST-2");
    await removeFromCart(cookies, "EST-1");
    expect(ids((await getCart(cookies)).body)).toEqual(["EST-2"]);
  });

  it("PUT /api/cart updates quantities and returns the view with a total", async () => {
    const cookies = sessionOf(await getCart());
    await addToCart(cookies, "EST-1");
    const r = await call("cart/index.put", {
      method: "PUT",
      url: "/api/cart",
      cookies,
      json: { quantities: { "EST-1": 3 } },
    });
    expect(r.status).toBe(200);
    expect(qty(r.body, "EST-1")).toBe(3);
    expect((r.body as { total: number }).total).toBe(4950);
  });

  it("[SWHR2-C-0084] an item added in one session does not appear in another session's cart", async () => {
    const a = sessionOf(await getCart());
    const b = sessionOf(await getCart());
    await addToCart(a, "EST-1");
    expect(ids((await getCart(a)).body)).toEqual(["EST-1"]);
    expect(ids((await getCart(b)).body)).toEqual([]);
  });

  it("[SWHR2-C-0085] signing out with EST-1 in the cart leaves the cart empty afterwards", async () => {
    const s = sessionOf(await getCart());
    await addToCart(s, "EST-1");
    const out = await call("session/sign-out.post", {
      method: "POST",
      url: "/api/session/sign-out",
      cookies: s,
    });
    const next = { ps_sid: cookieOf(out, "ps_sid") ?? s.ps_sid };
    expect(ids((await getCart(next)).body)).toEqual([]);
    expect(ids((await getCart()).body)).toEqual([]);
  });
});
