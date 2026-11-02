import { H3Event } from "nitro/h3";
import { vi } from "vitest";

const ADMIN = { userId: "admin", password: "admin-pw" };

/** Fresh modules (and so a fresh in-memory db and session store) with an administrator configured. */
export async function loadOrders() {
  vi.resetModules();
  process.env.ADMIN_USERS = `${ADMIN.userId}:${await Bun.password.hash(ADMIN.password)}`;
  const { db } = await import("../../db/client");
  const client = db.$client as unknown as import("bun:sqlite").Database;
  const session = (await import("../../middleware/10.session")).default as (e: H3Event) => unknown;
  return { db, client, session };
}

export type App = Awaited<ReturnType<typeof loadOrders>>;

/** Runs the session middleware, then the route handler, the way Nitro does for one request. */
export async function call(
  app: App,
  handlerPath: string,
  req: { method?: string; url: string; cookies?: Record<string, string>; json?: unknown },
): Promise<{ status: number; body: unknown; setCookies: string[] }> {
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
  const handler = (await import(/* @vite-ignore */ handlerPath)).default as (
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
  if (status === 200 && event.res.status) status = event.res.status;
  return { status, body: out, setCookies: event.res.headers.getSetCookie?.() ?? [] };
}

/** Signs in as administrator and returns the cookie bag for later calls. */
export async function adminCookies(app: App) {
  const r = await call(app, "../../routes/api/admin/sign-in.post", {
    method: "POST",
    url: "/api/admin/sign-in",
    json: ADMIN,
  });
  const c = r.setCookies.find((s) => s.startsWith("admin_sid="));
  return { admin_sid: c ? (c.slice("admin_sid=".length).split(";")[0] ?? "") : "" };
}

export async function deliver(doc: { orderId: string; locale: string; total: number }) {
  const { receiveOrder } = await import("./receive");
  await receiveOrder({
    orderId: doc.orderId,
    locale: doc.locale,
    totalPrice: doc.total,
    lines: [{ itemId: "EST-1", lineNumber: 1, quantity: 1, unitPrice: doc.total }],
  });
}

export const statusOf = (client: import("bun:sqlite").Database, orderId: string) =>
  (
    client.query("select status from op_order_workflow where order_id = ?").get(orderId) as
      | { status: string }
      | undefined
  )?.status;

export const messagesOn = (client: import("bun:sqlite").Database, channel: string) =>
  client.query("select * from messages where channel = ?").all(channel) as {
    payload: string;
    status: string;
  }[];
