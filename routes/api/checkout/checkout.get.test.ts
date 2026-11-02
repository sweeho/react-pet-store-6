// @vitest-environment node
import { describe, expect, it } from "vitest";

import { call, customers } from "../../../services/customers/testHarness";

describe("GET /api/checkout", () => {
  it("[SWHR2-C-0215] pre-fills billing and shipping from the signed-in customer's account", async () => {
    const app = await customers();
    await app.create("j2ee");
    await app.client.exec(
      `insert or replace into signon_users (user_id, password_hash) values ('j2ee', '${await Bun.password.hash("j2ee")}')`,
    );
    const signed = await call(app, "session/sign-in.post", {
      method: "POST",
      url: "/api/session/sign-in",
      json: { userId: "j2ee", password: "j2ee", remember: false },
    });
    const sid = signed.setCookies
      .find((c) => c.startsWith("ps_sid="))!
      .split(";")[0]
      .slice(7);
    const r = await call(app, "checkout/index.get", {
      url: "/api/checkout",
      cookies: { ps_sid: sid },
    });
    expect(r.status).toBe(200);
    const body = r.body as { billing: Record<string, string>; shipping: Record<string, string> };
    for (const part of [body.billing, body.shipping])
      expect(part).toMatchObject({
        givenName: "Jane",
        familyName: "Doe",
        street: "1 Main St",
        city: "Palo Alto",
        state: "CA",
        zip: "94303",
        country: "USA",
        phone: "555-0100",
        email: "jane@example.com",
      });
  });

  it("[SWHR2-C-0252] a visitor who is not signed in is refused with 401", async () => {
    const app = await customers();
    const r = await call(app, "checkout/index.get", { url: "/api/checkout" });
    expect(r.status).toBe(401);
  });
});
