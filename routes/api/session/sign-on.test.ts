import { H3Event } from "nitro/h3";
import { afterEach, describe, expect, it, vi } from "vitest";

const ADMIN = { userId: "admin", password: "admin-pw" };
const SUPPLIER = { userId: "supplier", password: "supplier-pw" };
const MIN = 60 * 1000;

/** Fresh modules (so a fresh in-memory db and session store) with operator credentials configured. */
async function loadApp() {
  vi.resetModules();
  process.env.ADMIN_USERS = `${ADMIN.userId}:${await Bun.password.hash(ADMIN.password)}`;
  process.env.SUPPLIER_USERS = `${SUPPLIER.userId}:${await Bun.password.hash(SUPPLIER.password)}`;
  const { db } = await import("../../../db/client");
  const client = db.$client as unknown as import("bun:sqlite").Database;
  const session = (await import("../../../middleware/10.session")).default as (
    e: H3Event,
  ) => unknown;
  return { client, session };
}

async function seedCustomer(
  client: import("bun:sqlite").Database,
  userId: string,
  password: string,
) {
  const hash = await Bun.password.hash(password);
  client.exec(
    "create table if not exists signon_users (user_id text primary key not null, password_hash text not null)",
  );
  client
    .query("insert or replace into signon_users (user_id, password_hash) values (?, ?)")
    .run(userId, hash);
}

interface Reply {
  status: number;
  body: unknown;
  setCookies: string[];
}

/** Runs the session middleware, then the route handler at `route` (under routes/api), as Nitro does. */
async function call(
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
  const handler = (await import(/* @vite-ignore */ `../${route}`)).default as (
    e: H3Event,
  ) => Promise<unknown>;
  let body: unknown;
  let status = 200;
  try {
    body = await handler(event);
  } catch (err) {
    const e = err as { status?: number };
    status = e.status ?? 500;
    body = err;
  }
  return { status, body, setCookies: event.res.headers.getSetCookie() };
}

/** `value` of the first Set-Cookie called `name`, or undefined. */
function cookieValue(setCookies: string[], name: string) {
  const c = setCookies.find((s) => s.startsWith(`${name}=`));
  return c ? c.slice(name.length + 1).split(";")[0] : undefined;
}

const maxAge = (setCookie: string) => /max-age=(-?\d+)/i.exec(setCookie)?.[1];

afterEach(() => vi.useRealTimers());

async function signInCustomer(
  app: Awaited<ReturnType<typeof loadApp>>,
  userId = "j2ee",
  remember = false,
  cookies?: Record<string, string>,
) {
  await seedCustomer(app.client, userId, `${userId}-pw`);
  return call(app, "session/sign-in.post", {
    method: "POST",
    url: "/api/session/sign-in",
    cookies,
    json: { userId, password: `${userId}-pw`, remember },
  });
}

describe("storefront sign-on", () => {
  it("[SWHR2-C-0262] a shopper idle for 16 minutes is signed out and finds the cart empty", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const app = await loadApp();
    const signed = await signInCustomer(app);
    expect(signed.status).toBe(200);
    const sid = cookieValue(signed.setCookies, "ps_sid")!;
    await call(app, "cart/items.post", {
      method: "POST",
      url: "/api/cart/items",
      cookies: { ps_sid: sid },
      json: { itemId: "EST-1" },
    });
    const live = await call(app, "session.get", { url: "/api/session", cookies: { ps_sid: sid } });
    expect(live.body).toMatchObject({ signedOn: true, userId: "j2ee" });
    vi.setSystemTime(Date.now() + 16 * MIN);
    const who = await call(app, "session.get", { url: "/api/session", cookies: { ps_sid: sid } });
    expect((who.body as { signedOn: boolean }).signedOn).toBe(false);
    const cart = await call(app, "cart/index.get", { url: "/api/cart", cookies: { ps_sid: sid } });
    expect(JSON.stringify(cart.body)).not.toContain("EST-1");
  });

  it("a shopper idle for 14 minutes stays signed on", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const app = await loadApp();
    const sid = cookieValue((await signInCustomer(app)).setCookies, "ps_sid")!;
    vi.setSystemTime(Date.now() + 14 * MIN);
    const who = await call(app, "session.get", { url: "/api/session", cookies: { ps_sid: sid } });
    expect(who.body).toMatchObject({ signedOn: true });
  });

  it("[SWHR2-C-0260] signing in as ann with the option ticked sets a 31-day remembered-name cookie", async () => {
    const app = await loadApp();
    const r = await signInCustomer(app, "ann", true);
    const c = r.setCookies.find((s) => s.startsWith("remembered_username="));
    expect(c).toMatch(/^remembered_username=ann(;|$)/);
    expect(maxAge(c!)).toBe("2678400");
  });

  it("[SWHR2-C-0261] signing in without the option ticked removes the remembered name", async () => {
    const app = await loadApp();
    const r = await signInCustomer(app, "ann", false, { remembered_username: "ann" });
    const c = r.setCookies.find((s) => s.startsWith("remembered_username="));
    expect(c).toBeDefined();
    expect(maxAge(c!)).toBe("0");
  });

  it("rejected credentials answer 401 and set no remembered name", async () => {
    const app = await loadApp();
    await seedCustomer(app.client, "ann", "ann-pw");
    const r = await call(app, "session/sign-in.post", {
      method: "POST",
      url: "/api/session/sign-in",
      json: { userId: "ann", password: "nope", remember: true },
    });
    expect(r.status).toBe(401);
    expect(r.setCookies.some((s) => s.startsWith("remembered_username="))).toBe(false);
  });

  it("GET /api/session returns the remembered user name from its cookie", async () => {
    const app = await loadApp();
    const r = await call(app, "session.get", {
      url: "/api/session",
      cookies: { remembered_username: "ann" },
    });
    expect(r.body).toEqual({ locale: "en_US", signedOn: false, rememberedUserName: "ann" });
  });

  it("[SWHR2-C-0269] signing out empties the cart, ends sign-on and keeps the locale", async () => {
    const app = await loadApp();
    const sid = cookieValue((await signInCustomer(app)).setCookies, "ps_sid")!;
    const cookies = { ps_sid: sid };
    await call(app, "session/locale.post", {
      method: "POST",
      url: "/api/session/locale",
      cookies,
      json: { locale: "ja_JP" },
    });
    for (const itemId of ["EST-1", "EST-2"])
      await call(app, "cart/items.post", {
        method: "POST",
        url: "/api/cart/items",
        cookies,
        json: { itemId },
      });
    const out = await call(app, "session/sign-out.post", {
      method: "POST",
      url: "/api/session/sign-out",
      cookies,
    });
    const next = cookieValue(out.setCookies, "ps_sid")!;
    expect(next).not.toBe(sid);
    const who = await call(app, "session.get", { url: "/api/session", cookies: { ps_sid: next } });
    expect(who.body).toMatchObject({ locale: "ja_JP", signedOn: false });
    const cart = await call(app, "cart/index.get", {
      url: "/api/cart",
      cookies: { ps_sid: next },
    });
    expect((cart.body as { lines: unknown[] }).lines).toEqual([]);
    const old = await call(app, "session.get", { url: "/api/session", cookies });
    expect((old.body as { signedOn: boolean }).signedOn).toBe(false);
  });

  it("[SWHR2-C-0253] the account route asks a visitor who is not signed on to sign in (401 SignOnRequired)", async () => {
    const app = await loadApp();
    const r = await call(app, "account/index.get", { url: "/api/account" });
    expect(r.status).toBe(401);
    expect(r.body).toMatchObject({ data: { kind: "SignOnRequired" } });
  });

  it("the account route answers a signed-on customer", async () => {
    const app = await loadApp();
    const sid = cookieValue((await signInCustomer(app)).setCookies, "ps_sid")!;
    const r = await call(app, "account/index.get", {
      url: "/api/account",
      cookies: { ps_sid: sid },
    });
    expect(r.body).toEqual({ userId: "j2ee" });
  });
});

describe("administration and supplier sign-on", () => {
  const adminIn = (app: Awaited<ReturnType<typeof loadApp>>, password = ADMIN.password) =>
    call(app, "admin/sign-in.post", {
      method: "POST",
      url: "/api/admin/sign-in",
      json: { userId: ADMIN.userId, password },
    });
  const supplierIn = (app: Awaited<ReturnType<typeof loadApp>>, cookies?: Record<string, string>) =>
    call(app, "supplier/sign-in.post", {
      method: "POST",
      url: "/api/supplier/sign-in",
      cookies,
      json: SUPPLIER,
    });

  it("[SWHR2-C-0259] an administrator idle for 55 minutes is asked to sign in on the next admin request", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const app = await loadApp();
    const signed = await adminIn(app);
    expect(signed.status).toBe(200);
    const sid = cookieValue(signed.setCookies, "admin_sid")!;
    const ask = () =>
      call(app, "admin/session.get", { url: "/api/admin/session", cookies: { admin_sid: sid } });
    expect((await ask()).status).toBe(200);
    vi.setSystemTime(Date.now() + 53 * MIN);
    expect((await ask()).status).toBe(200);
    vi.setSystemTime(Date.now() + 55 * MIN);
    expect((await ask()).status).toBe(401);
  });

  it("[SWHR2-C-0257] an admin request without a session is refused so the sign-in screen is shown", async () => {
    const app = await loadApp();
    const r = await call(app, "admin/session.get", { url: "/api/admin/session" });
    expect(r.status).toBe(401);
  });

  it("[SWHR2-C-0258] wrong admin credentials answer 401", async () => {
    const app = await loadApp();
    expect((await adminIn(app, "wrong")).status).toBe(401);
  });

  it("[SWHR2-C-0255] after admin signs out, the admin session is gone and supplier signs in on its own", async () => {
    const app = await loadApp();
    const sid = cookieValue((await adminIn(app)).setCookies, "admin_sid")!;
    await call(app, "admin/sign-out.post", {
      method: "POST",
      url: "/api/admin/sign-out",
      cookies: { admin_sid: sid },
    });
    const gone = await call(app, "admin/session.get", {
      url: "/api/admin/session",
      cookies: { admin_sid: sid },
    });
    expect(gone.status).toBe(401);
    const sup = await supplierIn(app, { admin_sid: sid });
    expect(sup.status).toBe(200);
    const ssid = cookieValue(sup.setCookies, "supplier_sid")!;
    const home = await call(app, "supplier/session.get", {
      url: "/api/supplier/session",
      cookies: { supplier_sid: ssid },
    });
    expect(home.status).toBe(200);
  });

  it("[SWHR2-C-0256] supplier sign-in is refused with AdminSignedIn while an admin session is live", async () => {
    const app = await loadApp();
    const sid = cookieValue((await adminIn(app)).setCookies, "admin_sid")!;
    const refused = await supplierIn(app, { admin_sid: sid });
    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({ data: { kind: "AdminSignedIn" } });
    await call(app, "admin/sign-out.post", {
      method: "POST",
      url: "/api/admin/sign-out",
      cookies: { admin_sid: sid },
    });
    expect((await supplierIn(app, { admin_sid: sid })).status).toBe(200);
  });

  it("supplier rejected credentials answer 401", async () => {
    const app = await loadApp();
    const r = await call(app, "supplier/sign-in.post", {
      method: "POST",
      url: "/api/supplier/sign-in",
      json: { userId: "supplier", password: "wrong" },
    });
    expect(r.status).toBe(401);
  });
});
