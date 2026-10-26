import { H3Event } from "nitro/h3";

import { seeder } from "../catalog-browsing/harness";
import { cookieValue, loadApp, seedCustomer } from "../sign-on/harness";

export { cookieValue, loadApp, seedCustomer };

export interface Reply {
  status: number;
  body: unknown;
  setCookies: string[];
}

/** Runs the session middleware then a route handler; unlike sign-on's helper it supplies route params. */
export async function call(
  app: Awaited<ReturnType<typeof loadApp>>,
  handlerPath: string,
  req: {
    method?: string;
    url: string;
    cookies?: Record<string, string>;
    json?: unknown;
    params?: Record<string, string>;
  },
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
  const handler = (await import(/* @vite-ignore */ handlerPath)).default as (
    e: H3Event,
  ) => Promise<unknown>;
  let out: unknown;
  let status = 200;
  try {
    out = await handler(event);
  } catch (err) {
    const e = err as { status?: number; statusCode?: number; data?: unknown };
    status = e.status ?? e.statusCode ?? 500;
    out = e.data ?? err;
  }
  const res = out instanceof Response ? out : null;
  if (res) status = res.status;
  else if (event.res.status && status === 200) status = event.res.status;
  const setCookies = [
    ...(event.res.headers.getSetCookie?.() ?? []),
    ...(res?.headers.getSetCookie?.() ?? []),
  ];
  return { status, body: res ? await res.clone().text() : out, setCookies };
}

const ROUTES = "../../../routes/api";
export const getCart = (
  app: Awaited<ReturnType<typeof loadApp>>,
  cookies?: Record<string, string>,
) => call(app, `${ROUTES}/cart/index.get`, { url: "/api/cart", cookies });
export const addToCart = (
  app: Awaited<ReturnType<typeof loadApp>>,
  cookies: Record<string, string> | undefined,
  itemId: string,
  quantity?: number,
) =>
  call(app, `${ROUTES}/cart/items.post`, {
    method: "POST",
    url: "/api/cart/items",
    cookies,
    json: { itemId, quantity },
  });
export const removeFromCart = (
  app: Awaited<ReturnType<typeof loadApp>>,
  cookies: Record<string, string> | undefined,
  itemId: string,
) =>
  call(app, `${ROUTES}/cart/items/[itemId].delete`, {
    method: "DELETE",
    url: `/api/cart/items/${itemId}`,
    cookies,
    params: { itemId },
  });

/** Item ids on a cart view, whether the view is a bare list or `{ lines }`. */
export function ids(view: unknown): string[] {
  const v = view as { lines?: Record<string, unknown>[] } | Record<string, unknown>[];
  const lines = Array.isArray(v) ? v : (v.lines ?? []);
  return lines.map((l) => String(l.itemId ?? l.id));
}
export function qty(view: unknown, itemId: string): number | undefined {
  const v = view as { lines?: Record<string, unknown>[] } | Record<string, unknown>[];
  const lines = Array.isArray(v) ? v : (v.lines ?? []);
  const line = lines.find((l) => String(l.itemId ?? l.id) === itemId);
  return line ? Number(line.quantity) : undefined;
}

/** App with catalog items EST-1..EST-3 in en_US. */
export async function cartApp() {
  const app = await loadApp();
  const s = seeder(app.client);
  s.category("FISH", { en_US: "Fish" });
  s.product("FI-SW-01", "FISH", { en_US: "Angelfish" });
  for (const [i, n] of [
    [1, "Large Angelfish"],
    [2, "Small Angelfish"],
    [3, "Spotted Angelfish"],
  ] as const)
    s.item({
      id: `EST-${i}`,
      product: "FI-SW-01",
      details: { en_US: { descn: n, list: 1650, unit: 1650 } },
    });
  return app;
}

export const sessionOf = (r: Reply) => ({ ps_sid: cookieValue(r.setCookies, "ps_sid") ?? "" });
