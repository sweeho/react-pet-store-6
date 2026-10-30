// @vitest-environment node
import { describe, expect, it } from "vitest";

import { call, customers, loadApp } from "../../../services/customers/testHarness";

const signIn = (app: Awaited<ReturnType<typeof loadApp>>, userId: string, password: string) =>
  call(app, "session/sign-in.post", {
    method: "POST",
    url: "/api/session/sign-in",
    json: { userId, password, remember: false },
  });

describe("My List panel data", () => {
  it("[SWHR2-C-0158] the My List panel shows only the first 10 products when the favourite category has 12", async () => {
    const app = await customers();
    const { client } = app;
    client.exec("insert into catalog_categories (category_id) values ('TEST')");
    client.exec(
      "insert into catalog_category_details values ('TEST', 'en_US', 'Test', 'Test', 'c.gif')",
    );
    for (let i = 1; i <= 12; i++) {
      const n = `Product ${String(i).padStart(2, "0")}`;
      client.exec(`insert into catalog_products values ('T-${i}', 'TEST')`);
      client.exec(
        `insert into catalog_product_details values ('T-${i}', 'en_US', '${n}', '${n}', 'p.gif')`,
      );
    }
    await app.create("j2ee", {
      preferredLanguage: "en_US",
      favouriteCategory: "TEST",
      myListOn: true,
      bannerOn: true,
    });
    const signed = await signIn(app as never, "j2ee", "secret1");
    const sid = signed.setCookies
      .find((c) => c.startsWith("ps_sid="))!
      .split(";")[0]
      .slice(7);
    const r = await call(app as never, "account/my-list.get", {
      url: "/api/account/my-list",
      cookies: { ps_sid: sid },
    });
    const body = r.body as { items?: unknown[] } | unknown[];
    const list = (Array.isArray(body) ? body : (body.items ?? [])) as Record<string, unknown>[];
    expect(list).toHaveLength(10);
    const text = JSON.stringify(list);
    expect(text).toContain("Product 10");
    expect(text).not.toContain("Product 11");
    expect(text).not.toContain("Product 12");
  });
});
