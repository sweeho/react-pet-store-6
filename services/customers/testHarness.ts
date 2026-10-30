import type { Database } from "bun:sqlite";
import { H3Event } from "nitro/h3";
import { vi } from "vitest";

/** Test support for the customer-account tests: a fresh app (db and sessions) and a request runner. */
export async function loadApp() {
  vi.resetModules();
  const { db } = await import("../../db/client");
  const client = db.$client as unknown as Database;
  const session = (await import("../../middleware/10.session")).default as (e: H3Event) => unknown;
  return { db, client, session };
}

export const ADDRESS = {
  street1: "1 Main St",
  street2: "",
  city: "Palo Alto",
  state: "CA",
  zip: "94303",
  country: "USA",
};

export function account(overrides: { telephone?: string } = {}) {
  return {
    contact: {
      givenName: "Jane",
      familyName: "Doe",
      telephone: overrides.telephone ?? "555-0100",
      email: "jane@example.com",
      address: { ...ADDRESS },
    },
    card: {
      cardNumber: "4111111111111111",
      cardType: "Java(TM) Card",
      expiryMonth: 12,
      expiryYear: 2030,
    },
  };
}

export async function customers() {
  const app = await loadApp();
  const svc = await import("./index");
  const create = async (userId: string, profile?: Record<string, unknown>) => {
    await svc.registerUser(userId, "secret1");
    return svc.createCustomer(userId, account(), profile);
  };
  return { ...app, svc, create };
}

export const count = (client: Database, table: string, where = "1=1") =>
  (client.query(`select count(*) n from ${table} where ${where}`).get() as { n: number }).n;

export const profileOf = (client: Database, userId: string) =>
  client.query("select * from customer_profiles where user_id = ?").get(userId) as
    | {
        preferred_language: string;
        favourite_category: string | null;
        my_list_on: number;
        banner_on: number;
      }
    | undefined;

/** Fails any insert into `table` via a SQLite trigger. */
export function failInsertsInto(client: Database, table: string) {
  client.exec(
    `create trigger fail_${table} before insert on ${table} begin select raise(abort, 'injected failure'); end`,
  );
}

export interface Reply {
  status: number;
  body: unknown;
  setCookies: string[];
}

/** Runs the session middleware, then the route handler at `route` (under routes/api). */
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
    const e = err as { status?: number; statusCode?: number; data?: unknown };
    status = e.status ?? e.statusCode ?? 500;
    out = e.data ?? err;
  }
  if (status === 200 && event.res.status) status = event.res.status;
  return { status, body: out, setCookies: event.res.headers.getSetCookie?.() ?? [] };
}
