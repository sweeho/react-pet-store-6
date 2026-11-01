import { describe, expect, it } from "vitest";

import {
  addToCart,
  call,
  cartApp,
  getCart,
  ids,
  qty,
  removeFromCart,
  sessionOf,
} from "../../../tests/acceptance/shopping-cart/harness";

describe("cart routes", () => {
  it("[SWHR2-C-0083] a new session gets an empty cart view with a total", async () => {
    const app = await cartApp();
    const r = await getCart(app);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ locale: "en_US", lines: [], total: 0 });
    expect(sessionOf(r).ps_sid).toBeTruthy();
  });

  it("[SWHR2-C-0096] adding without a quantity sets 1 and returns the full view", async () => {
    const app = await cartApp();
    const cookies = sessionOf(await getCart(app));
    const r = await addToCart(app, cookies, "EST-1");
    expect(r.status).toBe(200);
    expect(qty(r.body, "EST-1")).toBe(1);
    expect((r.body as { total: number }).total).toBe(1650);
  });

  it("[SWHR2-C-0081] adding with a quantity replaces the existing one", async () => {
    const app = await cartApp();
    const cookies = sessionOf(await getCart(app));
    await addToCart(app, cookies, "EST-1", 3);
    expect(qty((await addToCart(app, cookies, "EST-1", 2)).body, "EST-1")).toBe(2);
  });

  it("[SWHR2-C-0098] removing a line returns the view without it, and an absent item is a no-op", async () => {
    const app = await cartApp();
    const cookies = sessionOf(await getCart(app));
    await addToCart(app, cookies, "EST-1", 4);
    await addToCart(app, cookies, "EST-2");
    expect(ids((await removeFromCart(app, cookies, "EST-1")).body)).toEqual(["EST-2"]);
    const again = await removeFromCart(app, cookies, "EST-1");
    expect(again.status).toBe(200);
    expect(ids(again.body)).toEqual(["EST-2"]);
  });

  it("[SWHR2-C-0086] Update Cart sets quantities and returns the totals", async () => {
    const app = await cartApp();
    const cookies = sessionOf(await getCart(app));
    await addToCart(app, cookies, "EST-1");
    const r = await call(app, "../../../routes/api/cart/index.put", {
      method: "PUT",
      url: "/api/cart",
      cookies,
      json: { quantities: { "EST-1": 2 } },
    });
    expect(r.status).toBe(200);
    expect(qty(r.body, "EST-1")).toBe(2);
    expect((r.body as { total: number }).total).toBe(3300);
  });

  it("[SWHR2-C-0086] Update Cart rejects a body without quantities", async () => {
    const app = await cartApp();
    const cookies = sessionOf(await getCart(app));
    const r = await call(app, "../../../routes/api/cart/index.put", {
      method: "PUT",
      url: "/api/cart",
      cookies,
      json: {},
    });
    expect(r.status).toBe(400);
  });

  it("[SWHR2-C-0084] two sessions have separate carts", async () => {
    const app = await cartApp();
    const a = sessionOf(await getCart(app));
    const b = sessionOf(await getCart(app));
    await addToCart(app, a, "EST-1");
    expect(ids((await getCart(app, b)).body)).toEqual([]);
  });

  it("[SWHR2-C-0093] [SWHR2-C-0094] an anonymous visitor adds and removes EST-1 with no role check", async () => {
    const app = await cartApp();
    const cookies = sessionOf(await getCart(app));
    const added = await addToCart(app, cookies, "EST-1");
    expect(added.status).toBe(200);
    expect(qty(added.body, "EST-1")).toBe(1);
    const removed = await removeFromCart(app, cookies, "EST-1");
    expect(removed.status).toBe(200);
    expect(ids(removed.body)).toEqual([]);
  });

  it("[SWHR2-C-0085] [SWHR2-C-0095] signing out discards the cart for every later session", async () => {
    const app = await cartApp();
    const s1 = sessionOf(await getCart(app));
    await addToCart(app, s1, "EST-1", 2);
    await call(app, "../../../routes/api/session/sign-out.post", {
      method: "POST",
      url: "/api/session/sign-out",
      cookies: s1,
    });
    expect(ids((await getCart(app, s1)).body)).toEqual([]);
    expect(ids((await getCart(app)).body)).toEqual([]);
  });
});
