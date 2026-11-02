// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { call, orderIdOf, shopper } from "../../../tests/acceptance/checkout/harness";

const text = (body: unknown) => (typeof body === "string" ? body : JSON.stringify(body));

describe("POST /api/orders", () => {
  it("[SWHR2-C-0220] answers at once with the order id and leaves the document pending on order.new", async () => {
    const app = await shopper();
    const r = await app.place();
    expect(r.status).toBe(200);
    const orderId = orderIdOf(r.body);
    expect(orderId).toBe("10011");
    const waiting = app.client
      .query("select payload, status from messages where channel = 'order.new'")
      .all() as { payload: string; status: string }[];
    expect(waiting).toHaveLength(1);
    expect(waiting[0].status).toBe("pending");
    expect(waiting[0].payload).toContain(`<OrderId>${orderId}</OrderId>`);
    expect(app.client.query("select count(*) n from op_order_workflow").get()).toEqual({ n: 0 });
  });

  it("[SWHR2-C-0217] consecutive orders get 10011, 10012 and 10013", async () => {
    const app = await shopper();
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) ids.push(orderIdOf((await app.place()).body));
    expect(ids).toEqual(["10011", "10012", "10013"]);
  });

  it("[SWHR2-C-0101] placing an order empties the cart", async () => {
    const app = await shopper();
    expect((await app.place()).status).toBe(200);
    const cart = await call(app, "../../../routes/api/cart/index.get", {
      url: "/api/cart",
      cookies: app.cookies,
    });
    expect(text(cart.body)).toContain('"lines":[]');
  });

  it("[SWHR2-C-0090] an empty cart is refused as EmptyCartOrder before the fields are checked, and nothing is stored", async () => {
    const app = await shopper();
    const r = await call(app, "../../../routes/api/orders/index.post", {
      method: "POST",
      url: "/api/orders",
      cookies: app.cookies,
      json: { billing: {}, shipping: {} },
    });
    expect(r.status).toBe(422);
    expect(text(r.body)).toContain("EmptyCartOrder");
    expect(app.client.query("select count(*) n from messages").get()).toEqual({ n: 0 });
    expect(app.client.query("select count(*) n from id_sequences").get()).toEqual({ n: 0 });
  });

  it("[SWHR2-C-0252] a visitor who is not signed in is refused with SignOnRequired", async () => {
    const app = await shopper();
    const r = await call(app, "../../../routes/api/orders/index.post", {
      method: "POST",
      url: "/api/orders",
      json: { billing: {}, shipping: {} },
    });
    expect(r.status).toBe(401);
    expect(text(r.body)).toContain("SignOnRequired");
  });

  it("[SWHR2-C-0212] an unexpected failure is answered as AppFailure with message and trace and keeps no order", async () => {
    vi.resetModules();
    vi.doMock("../../../services/ids", () => ({
      nextId: () => {
        throw new Error("boom-test");
      },
    }));
    const app = await shopper();
    const r = await app.place();
    expect(r.status).toBe(500);
    const body = text(r.body);
    expect(body).toContain("AppFailure");
    expect(body).toContain("boom-test");
    expect(body).toMatch(/trace/);
    expect(app.client.query("select count(*) n from messages").get()).toEqual({ n: 0 });
    vi.doUnmock("../../../services/ids");
  });

  it("[SWHR2-C-0216] the billing and shipping details submitted are the ones carried on the order document", async () => {
    const app = await shopper();
    expect((await app.place()).status).toBe(200);
    const { payload } = app.client.query("select payload from messages").get() as {
      payload: string;
    };
    const { fromXml } = await import("../../../services/documents/purchase-order");
    const po = fromXml(payload);
    expect(po.billing.street).toBe("1 Main St");
    expect(po.shipping.email).toBe("abc@xyz.com");
    expect(po.card.cardNumber).toBe("4111111111111111");
    expect(po.lines).toEqual([
      expect.objectContaining({ lineNumber: 1, itemId: "EST-1", quantity: 1, unitPrice: 1650 }),
    ]);
  });
});
