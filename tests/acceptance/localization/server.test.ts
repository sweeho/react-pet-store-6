// @vitest-environment node
import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { call } from "../shopping-cart/harness";
import { seeder } from "../catalog-browsing/harness";
import { loadApp, seedCustomer } from "../sign-on/harness";

type App = Awaited<ReturnType<typeof loadApp>>;

const EN = "Large Angelfish";
const JA = "大きなエンゼルフィッシュ";
const ATTR_EN = "Spotted fish";
const ATTR_JA = "斑点のある魚";
const ROUTES = "../../../routes/api";

/** App whose EST-1 has distinct en_US and ja_JP details. */
async function twoLocaleApp() {
  const app = await loadApp();
  const s = seeder(app.client);
  s.category("FISH", { en_US: "Fish", ja_JP: "魚" });
  s.product("FI-SW-01", "FISH", { en_US: "Angelfish", ja_JP: "エンゼル" });
  s.item({
    id: "EST-1",
    product: "FI-SW-01",
    details: {
      en_US: { descn: EN, list: 1650, unit: 1000 },
      ja_JP: { descn: JA, list: 1951, unit: 1551 },
    },
  });
  // item attribute text: whichever columns the details table names as attributes
  const cols = (
    app.client.query("pragma table_info(catalog_item_details)").all() as { name: string }[]
  )
    .map((c) => c.name)
    .filter((n) => /attr/i.test(n));
  expect(cols, "catalog_item_details has attribute columns").not.toEqual([]);
  for (const [locale, text] of [
    ["en_US", ATTR_EN],
    ["ja_JP", ATTR_JA],
  ])
    for (const c of cols)
      app.client.exec(
        `update catalog_item_details set "${c}" = '${text}' where item_id = 'EST-1' and locale = '${locale}'`,
      );
  return app;
}

describe("catalog item in the shopper's locale", () => {
  const item = async (locale: string) => {
    const app = await twoLocaleApp();
    const r = await call(app, `${ROUTES}/catalog/items/[itemId].get`, {
      url: `/api/catalog/items/EST-1?locale=${locale}`,
      params: { itemId: "EST-1" },
    });
    return JSON.stringify(r.body);
  };

  // case: SWHR2-C-0029@v1
  it("SWHR2-C-0029: a ja_JP shopper viewing EST-1 gets the Japanese details and none of the English", async () => {
    // the item's name is its product name
    const out = await item("ja_JP");
    expect(out).toContain("エンゼル");
    expect(out).toContain(JA);
    expect(out).toContain(ATTR_JA);
    expect(out).not.toContain("Angelfish");
    expect(out).not.toContain(EN);
    expect(out).not.toContain(ATTR_EN);
  });

  // case: SWHR2-C-0030@v1
  it("SWHR2-C-0030: an en_US shopper viewing EST-1 gets the English details and none of the Japanese", async () => {
    const out = await item("en_US");
    expect(out).toContain("Angelfish");
    expect(out).toContain(EN);
    expect(out).toContain(ATTR_EN);
    expect(out).not.toContain("エンゼル");
    expect(out).not.toContain(JA);
    expect(out).not.toContain(ATTR_JA);
  });
});

describe("cart locale", () => {
  // case: SWHR2-C-0033@v1
  it("SWHR2-C-0033: a new cart with no locale lists EST-1 from the en_US details", async () => {
    await twoLocaleApp();
    const cart = await import("../../../services/cart");
    const c = new Map<string, number>();
    await cart.addItem(c, "EST-1");
    const out = JSON.stringify(await cart.lines(c, undefined));
    expect(out).toContain(EN);
    expect(out).not.toContain(JA);
  });

  // case: SWHR2-C-0034@v1
  it("SWHR2-C-0034: a cart with locale ja_JP lists EST-1 from the ja_JP details", async () => {
    await twoLocaleApp();
    const cart = await import("../../../services/cart");
    const c = new Map<string, number>();
    await cart.addItem(c, "EST-1");
    const out = JSON.stringify(await cart.lines(c, "ja_JP"));
    expect(out).toContain(JA);
    expect(out).not.toContain(EN);
  });
});

describe("request decoding", () => {
  const encoding = async () =>
    (await import("../../../middleware/00.encoding")).default as (e: H3Event) => unknown;

  /** A form POST whose body is UTF-8 percent-encoded and whose Content-Type names no charset. */
  const formEvent = (url: string, fields: Record<string, string>, cookie?: string) => {
    const body = Object.entries(fields)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    return new H3Event(
      new Request(`http://localhost${url}`, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          ...(cookie ? { cookie } : {}),
        },
        body,
      }),
    );
  };
  const formValue = async (e: H3Event, name: string) => (await e.req.clone().formData()).get(name);

  // case: SWHR2-C-0031@v1
  it("SWHR2-C-0031: sign-on receives the Chinese user name 张伟 decoded as UTF-8", async () => {
    const app: App = await loadApp();
    await seedCustomer(app.client, "张伟", "pw-1234");
    const mw = await encoding();
    const event = formEvent("/api/session/sign-in", { userId: "张伟", password: "pw-1234" });
    await mw(event);
    await app.session(event);
    expect(await formValue(event, "userId")).toBe("张伟");
    const handler = (await import(`${ROUTES}/session/sign-in.post`)).default as (
      e: H3Event,
    ) => Promise<unknown>;
    const out = await handler(event);
    const status = out instanceof Response ? out.status : event.res.status || 200;
    expect(status).toBe(200);
  });

  // case: SWHR2-C-0032@v1
  it("SWHR2-C-0032: after sign-on every handler of a request sees 山田太郎 decoded as UTF-8", async () => {
    const app: App = await loadApp();
    const mw = await encoding();
    const event = formEvent("/api/account/register", {
      userId: "山田太郎",
      password: "pw-1234",
      passwordRepeat: "pw-1234",
      remember: "false",
    });
    await mw(event);
    await app.session(event);
    // two real handlers read the one request's userId, one after the other
    const run = async (route: string) => {
      const handler = (await import(`${ROUTES}/${route}`)).default as (
        e: H3Event,
      ) => Promise<unknown>;
      const out = await handler(event);
      return out instanceof Response ? out.status : event.res.status || 200;
    };
    expect(await run("account/register.post")).toBeLessThan(300);
    expect(
      app.client.query("select count(*) c from signon_users where user_id = '山田太郎'").get(),
    ).toEqual({ c: 1 });
    expect(await run("session/sign-in.post")).toBe(200);
  });

  // case: SWHR2-C-0040@v1
  it("SWHR2-C-0040: a Chinese keyword in a search query parameter is read as the same characters", async () => {
    const app = await twoLocaleApp();
    seeder(app.client).product("FI-ZH", "FISH", { en_US: "金鱼", ja_JP: "金鱼", zh_CN: "金鱼" });
    const mw = await encoding();
    const event = new H3Event(
      new Request(`http://localhost/api/catalog/search?keyword=${encodeURIComponent("金鱼")}`),
    );
    await mw(event);
    await app.session(event);
    const handler = (await import(`${ROUTES}/catalog/search.get`)).default as (
      e: H3Event,
    ) => Promise<unknown>;
    const out = await handler(event);
    const text = out instanceof Response ? await out.text() : JSON.stringify(out);
    // a product named exactly the decoded keyword is found, so the search used the decoded keyword
    expect(text).toContain("FI-ZH");
  });
});
