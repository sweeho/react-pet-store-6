import { describe, expect, it } from "vitest";

import { call, shopper } from "../../../services/orders/harness.test";

describe("GET /api/checkout", () => {
  it("[SWHR2-C-0215] pre-fills billing and shipping from the signed-in customer's account", async () => {
    const app = await shopper();
    const { createCustomer } = await import("../../../services/customers");
    const { account } = await import("../../../services/customers/testHarness");
    createCustomer("j2ee", account());
    const r = await call(app, "checkout/index.get", {
      url: "/api/checkout",
      cookies: app.cookies,
    });
    expect(r.status).toBe(200);
    const body = r.body as { billing: Record<string, string>; shipping: Record<string, string> };
    for (const side of [body.billing, body.shipping])
      expect(side).toMatchObject({
        givenName: expect.any(String),
        familyName: expect.any(String),
        street: expect.any(String),
        city: expect.any(String),
        state: expect.any(String),
        zip: expect.any(String),
        country: expect.any(String),
        email: expect.any(String),
        phone: expect.any(String),
      });
    expect(body.billing).toMatchObject({
      givenName: "Jane",
      street: "1 Main St",
      phone: "555-0100",
    });
    expect(body.billing).toEqual(body.shipping);
  });

  it("[SWHR2-C-0252] answers a visitor who is not signed in with 401", async () => {
    const app = await shopper();
    const r = await call(app, "checkout/index.get", { url: "/api/checkout" });
    expect(r.status).toBe(401);
  });
});
