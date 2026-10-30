// @vitest-environment node
import { describe, expect, it } from "vitest";

import { call, customers, loadApp } from "../../../tests/acceptance/customer-account/harness";

const signIn = (app: Awaited<ReturnType<typeof loadApp>>, userId: string, password: string) =>
  call(app, "../../../routes/api/session/sign-in.post", {
    method: "POST",
    url: "/api/session/sign-in",
    json: { userId, password, remember: false },
  });

describe("My List panel data", () => {
  it("[SWHR2-C-0158] the My List panel shows only the first 10 products when the favourite category has 12", async () => {
    const app = await customers();
    const { seeder } = await import("../../../tests/acceptance/catalog-browsing/harness");
    const s = seeder(app.client);
    s.category("TEST", { en_US: "Test" });
    for (let i = 1; i <= 12; i++) {
      const n = `Product ${String(i).padStart(2, "0")}`;
      s.product(`T-${i}`, "TEST", { en_US: n });
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
    const r = await call(app as never, "../../../routes/api/account/my-list.get", {
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
