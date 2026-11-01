import { describe, expect, it, vi } from "vitest";

import {
  call,
  cookieValue,
  count,
  orderIdOf,
  ORDER_TABLES,
  shopper,
  SHIPPING,
} from "../../../services/orders/harness.test";

const text = (b: unknown) => (typeof b === "string" ? b : JSON.stringify(b));

describe("POST /api/orders", () => {
  it("[SWHR2-C-0212] answers an unexpected failure as 500 AppFailure with message and trace", async () => {
    vi.resetModules();
    vi.doMock("../../../services/ids", () => ({
      nextId: () => {
        throw new Error("boom-test");
      },
    }));
    const app = await shopper();
    const r = await app.place();
    vi.doUnmock("../../../services/ids");
    expect(r.status).toBe(500);
    expect(text(r.body)).toContain("AppFailure");
    expect(text(r.body)).toContain("boom-test");
    expect(text(r.body)).toMatch(/trace/i);
  });

  it("[SWHR2-C-0217] gives the first three orders 10011, 10012 and 10013", async () => {
    const app = await shopper();
    const ids = [];
    for (let i = 0; i < 3; i++) ids.push(orderIdOf((await app.place()).body));
    expect(ids).toEqual(["10011", "10012", "10013"]);
  });

  it("[SWHR2-C-0219] moves the 1001 counter by one for a second order", async () => {
    const app = await shopper();
    await app.place();
    const second = orderIdOf((await app.place()).body);
    expect(second).toBe("10012");
    expect(
      app.client.query("select next_value v from id_sequences where prefix = '1001'").get(),
    ).toEqual({ v: 2 });
  });

  it("[SWHR2-C-0220] returns at once and leaves the order pending on order.new", async () => {
    const app = await shopper();
    const r = await app.place();
    expect(r.status).toBe(200);
    const orderId = orderIdOf(r.body);
    const waiting = app.client
      .query("select payload, status from messages where channel = 'order.new'")
      .all() as { payload: string; status: string }[];
    expect(waiting).toHaveLength(1);
    expect(waiting[0].status).toBe("pending");
    expect(waiting[0].payload).toContain(orderId);
    for (const t of ORDER_TABLES) expect(count(app.client, t), t).toBe(0);
    expect(
      app.client.query("select status from op_order_workflow where order_id = ?").get(orderId),
    ).toBeFalsy();
  });

  it("[SWHR2-C-0101] empties the customer's cart once the order is placed", async () => {
    const app = await shopper();
    await app.place();
    const cart = await call(app, "cart/index.get", {
      url: "/api/cart",
      cookies: app.cookies,
    });
    expect((cart.body as { lines: unknown[] }).lines).toEqual([]);
  });

  it("[SWHR2-C-0090] refuses an empty cart with EmptyCartOrder and creates no order", async () => {
    const app = await shopper();
    const r = await call(app, "orders/index.post", {
      method: "POST",
      url: "/api/orders",
      cookies: app.cookies,
      json: { billing: SHIPPING, shipping: SHIPPING },
    });
    expect(r.status).toBe(422);
    expect(text(r.body)).toContain("EmptyCartOrder");
    expect(count(app.client, "messages")).toBe(0);
  });

  it("[SWHR2-C-0252] refuses a visitor who is not signed in with SignOnRequired", async () => {
    const app = await shopper();
    const r = await call(app, "orders/index.post", {
      method: "POST",
      url: "/api/orders",
      json: { billing: SHIPPING, shipping: SHIPPING },
    });
    expect(r.status).toBe(401);
    expect(text(r.body)).toContain("SignOnRequired");
    expect(count(app.client, "messages")).toBe(0);
  });

  it("[SWHR2-C-0254] trims values and refuses a missing required field", async () => {
    const app = await shopper();
    await call(app, "cart/items.post", {
      method: "POST",
      url: "/api/cart/items",
      cookies: app.cookies,
      json: { itemId: "EST-1" },
    });
    const send = (street: string) =>
      call(app, "orders/index.post", {
        method: "POST",
        url: "/api/orders",
        cookies: app.cookies,
        json: { billing: { ...SHIPPING, street }, shipping: SHIPPING },
      });
    expect((await send("   ")).status).toBe(400);
    expect((await send("  2 Elm St  ")).status).toBe(200);
    expect(
      (app.client.query("select payload from messages").get() as { payload: string }).payload,
    ).toContain("2 Elm St<");
  });

  it("[SWHR2-C-0174] a newly registered customer with an account can place an order", async () => {
    const app = await shopper();
    const { registerUser, createCustomer } = await import("../../../services/customers");
    const { account } = await import("../../../services/customers/testHarness");
    await registerUser("firsttimer", "secret1");
    await createCustomer("firsttimer", account());
    const signed = await call(app, "session/sign-in.post", {
      method: "POST",
      url: "/api/session/sign-in",
      json: { userId: "firsttimer", password: "secret1", remember: false },
    });
    const cookies = { ps_sid: cookieValue(signed.setCookies, "ps_sid") ?? "" };
    await call(app, "cart/items.post", {
      method: "POST",
      url: "/api/cart/items",
      cookies,
      json: { itemId: "EST-1" },
    });
    const r = await call(app, "orders/index.post", {
      method: "POST",
      url: "/api/orders",
      cookies,
      json: { billing: SHIPPING, shipping: SHIPPING },
    });
    expect(r.status).toBe(200);
    expect(orderIdOf(r.body)).toBe("10011");
    expect(
      (app.client.query("select payload from messages").get() as { payload: string }).payload,
    ).toContain("firsttimer");
  });
});
