// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { addToCart, cartApp, getCart, ids } from "../shopping-cart/harness";
import { ADMIN, call, cookieValue, loadApp, maxAge, seedCustomer } from "./harness";

afterEach(() => vi.useRealTimers());

const SIGN_IN = "../../../routes/api/session/sign-in.post";
const ADMIN_SIGN_IN = "../../../routes/api/admin/sign-in.post";
const ADMIN_SESSION = "../../../routes/api/admin/session.get";
const SESSION = "../../../routes/api/session.get";
const MIN = 60 * 1000;

describe("session expiry", () => {
  // case: SWHR2-C-0259@v1
  it("SWHR2-C-0259: an administrator idle for 55 minutes is asked to sign in on the next admin request", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const app = await loadApp();
    const signed = await call(app, ADMIN_SIGN_IN, {
      method: "POST",
      url: "/api/admin/sign-in",
      json: ADMIN,
    });
    expect(signed.status).toBe(200);
    const sid = cookieValue(signed.setCookies, "admin_sid");
    expect(sid).toBeTruthy();
    const before = await call(app, ADMIN_SESSION, {
      url: "/api/admin/session",
      cookies: { admin_sid: sid! },
    });
    expect(before.status).toBe(200);
    vi.setSystemTime(Date.now() + 55 * MIN);
    const after = await call(app, ADMIN_SESSION, {
      url: "/api/admin/session",
      cookies: { admin_sid: sid! },
    });
    expect(after.status).toBe(401);
  });

  // case: SWHR2-C-0262@v1
  it("SWHR2-C-0262: a shopper idle for 16 minutes is signed out and finds the cart empty", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const app = await cartApp();
    await seedCustomer(app.client, "j2ee", "j2ee");
    const signed = await call(app, SIGN_IN, {
      method: "POST",
      url: "/api/session/sign-in",
      json: { userId: "j2ee", password: "j2ee", remember: false },
    });
    expect(signed.status).toBe(200);
    const sid = cookieValue(signed.setCookies, "ps_sid")!;
    expect((await addToCart(app, { ps_sid: sid }, "EST-1")).status).toBe(200);
    expect(ids((await getCart(app, { ps_sid: sid })).body)).toEqual(["EST-1"]);
    vi.setSystemTime(Date.now() + 16 * MIN);
    const who = await call(app, SESSION, { url: "/api/session", cookies: { ps_sid: sid } });
    expect((who.body as { signedOn: boolean }).signedOn).toBe(false);
    const cart = await getCart(app, { ps_sid: sid });
    expect(ids(cart.body)).toEqual([]);
  });
});

describe("remembered user name", () => {
  const signIn = async (remember: boolean, cookies?: Record<string, string>) => {
    const app = await loadApp();
    await seedCustomer(app.client, "ann", "ann-pw");
    return call(app, SIGN_IN, {
      method: "POST",
      url: "/api/session/sign-in",
      cookies,
      json: { userId: "ann", password: "ann-pw", remember },
    });
  };

  // case: SWHR2-C-0260@v1
  it("SWHR2-C-0260: signing in as ann with the option ticked sets a 31-day remembered-name cookie", async () => {
    const r = await signIn(true);
    const c = r.setCookies.find((s) => s.startsWith("remembered_username="));
    expect(c).toBeDefined();
    expect(c).toMatch(/^remembered_username=ann(;|$)/);
    expect(maxAge(c!)).toBe("2678400");
  });

  // case: SWHR2-C-0261@v1
  it("SWHR2-C-0261: signing in without the option ticked removes the remembered name", async () => {
    const r = await signIn(false, { remembered_username: "ann" });
    const c = r.setCookies.find((s) => s.startsWith("remembered_username="));
    expect(c).toBeDefined();
    const past = /expires=([^;]+)/i.exec(c!)?.[1];
    expect(
      maxAge(c!) === "0" || (past !== undefined && new Date(past).getTime() < Date.now()),
    ).toBe(true);
  });
});
