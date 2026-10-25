import { H3Event } from "nitro/h3";
import { vi } from "vitest";

export const ADMIN = { userId: "admin", password: "admin-pw" };
export const SUPPLIER = { userId: "supplier", password: "supplier-pw" };

/** Fresh modules (and so a fresh in-memory db and session store) with operator credentials configured. */
export async function loadApp() {
  vi.resetModules();
  process.env.ADMIN_USERS = `${ADMIN.userId}:${await Bun.password.hash(ADMIN.password)}`;
  process.env.SUPPLIER_USERS = `${SUPPLIER.userId}:${await Bun.password.hash(SUPPLIER.password)}`;
  const { db } = await import("../../../db/client");
  const client = db.$client as unknown as import("bun:sqlite").Database;
  const session = (await import("../../../middleware/10.session")).default as (
    e: H3Event,
  ) => unknown;
  return { db, client, session };
}

/** Seeds storefront user `userId` (customer-account `signon_users`). */
export async function seedCustomer(
  client: import("bun:sqlite").Database,
  userId: string,
  password: string,
) {
  const hash = await Bun.password.hash(password);
  client.exec(
    `insert or replace into signon_users (user_id, password_hash) values ('${userId}', '${hash}')`,
  );
}

export interface Reply {
  status: number;
  body: unknown;
  setCookies: string[];
}

/** Runs the session middleware, then the route handler, the way Nitro does for one request. */
export async function call(
  app: Awaited<ReturnType<typeof loadApp>>,
  handlerPath: string,
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
  const res = out instanceof Response ? out : null;
  if (res) status = res.status;
  else if (event.res.status && status === 200) status = event.res.status;
  const setCookies = [
    ...(event.res.headers.getSetCookie?.() ?? []),
    ...(res?.headers.getSetCookie?.() ?? []),
  ];
  const body = res ? await res.clone().text() : out;
  return { status, body, setCookies };
}

/** `name=value` of the named Set-Cookie, or undefined. */
export function cookieValue(setCookies: string[], name: string) {
  const c = setCookies.find((s) => s.startsWith(`${name}=`));
  return c ? c.slice(name.length + 1).split(";")[0] : undefined;
}

export const maxAge = (setCookie: string) => /max-age=(-?\d+)/i.exec(setCookie)?.[1];
