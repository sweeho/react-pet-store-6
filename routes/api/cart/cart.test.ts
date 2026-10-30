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
  it("[SWHR2-C-0083] opening the cart in a new session creates an empty cart", async () => {
    const app = await cartApp();
    const r = await getCart(app);
    expect(r.status).toBe(200);
    expect(ids(r.body)).toEqual([]);
    expect((r.body as { total: number }).total).toBe(0);
    const cookies = sessionOf(r);
    await addToCart(app, cookies, "EST-1");
    expect(ids((await getCart(app, cookies)).body)).toEqual(["EST-1"]);
  });

  it("[SWHR2-C-0094] a visitor who has not signed on can remove EST-1", async () => {
    const app = await cartApp();
    const cookies = sessionOf(await getCart(app));
    await addToCart(app, cookies, "EST-1");
    const r = await removeFromCart(app, cookies, "EST-1");
    expect(r.status).toBe(200);
    expect(ids((await getCart(app, cookies)).body)).not.toContain("EST-1");
  });

  it("[SWHR2-C-0095] after a session ends its cart cannot be retrieved", async () => {
    const app = await cartApp();
    const s1 = sessionOf(await getCart(app));
    await addToCart(app, s1, "EST-1", 2);
    expect(qty((await getCart(app, s1)).body, "EST-1")).toBe(2);
    await call(app, "../../../routes/api/session/sign-out.post", {
      method: "POST",
      url: "/api/session/sign-out",
      cookies: s1,
    });
    expect(ids((await getCart(app, s1)).body)).toEqual([]);
    const s2 = await getCart(app);
    expect(JSON.stringify(s2.body)).not.toContain("EST-1");
  });

  it("[SWHR2-C-0098] removing EST-1 from a cart holding EST-1 and EST-2 leaves only EST-2", async () => {
    const app = await cartApp();
    const cookies = sessionOf(await getCart(app));
    await addToCart(app, cookies, "EST-1");
    await addToCart(app, cookies, "EST-2");
    await removeFromCart(app, cookies, "EST-1");
    expect(ids((await getCart(app, cookies)).body)).toEqual(["EST-2"]);
  });

  it("PUT /api/cart updates quantities and returns the view with a total", async () => {
    const app = await cartApp();
    const cookies = sessionOf(await getCart(app));
    await addToCart(app, cookies, "EST-1");
    const r = await call(app, "../../../routes/api/cart/index.put", {
      method: "PUT",
      url: "/api/cart",
      cookies,
      json: { quantities: { "EST-1": 3 } },
    });
    expect(r.status).toBe(200);
    expect(qty(r.body, "EST-1")).toBe(3);
    expect((r.body as { total: number }).total).toBe(4950);
  });
});
