// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";

import { listInventory } from "../../../services/supplier/inventory";
import { call, loadApp } from "../../../services/customers/testHarness";

const SUPPLIER = { userId: "supplier", password: "supplier-pw" };
const cookieValue = (setCookies: string[], name: string) =>
  setCookies.map((c) => c.match(new RegExp(`^${name}=([^;]*)`))?.[1]).find(Boolean);

type App = Awaited<ReturnType<typeof loadApp>>;
const LIST = "supplier/inventory.get";
const UPDATE = "supplier/inventory.post";

// Raw seeding starts with a read through the service, so the store is known to answer first.
const seed = (app: App, rows: [string, number][]) => {
  listInventory();
  rows.forEach(([id, q]) =>
    app.client.exec(
      `insert or replace into sup_inventory (item_id, quantity) values ('${id}', ${q})`,
    ),
  );
};
const qty = (app: App, id: string) =>
  (
    app.client.query("select quantity q from sup_inventory where item_id = ?").get(id) as {
      q: number;
    } | null
  )?.q;
const msgs = (app: App) =>
  app.client.query("select id from messages where channel = 'supplier.inventory-changed'").all();

async function cookies(app: App) {
  const r = await call(app, "supplier/sign-in.post", {
    method: "POST",
    url: "/api/supplier/sign-in",
    json: SUPPLIER,
  });
  return { supplier_sid: cookieValue(r.setCookies, "supplier_sid") ?? "" };
}
const post = (app: App, c: Record<string, string> | undefined, json: unknown) =>
  call(app, UPDATE, { method: "POST", url: "/api/supplier/inventory", cookies: c, json });

describe("supplier inventory routes", () => {
  let app: App;
  beforeEach(async () => {
    app = await loadApp();
    process.env.SUPPLIER_USERS = `${SUPPLIER.userId}:${await Bun.password.hash(SUPPLIER.password)}`;
    seed(app, [
      ["EST-1", 40],
      ["EST-2", 0],
      ["EST-3", 12],
    ]);
  });

  it("[SWHR2-C-0041] refuses a caller who is not signed in as supplier", async () => {
    expect((await call(app, LIST, { url: "/api/supplier/inventory" })).status).toBe(401);
    expect((await post(app, undefined, { rows: [] })).status).toBe(401);
  });

  it("[SWHR2-C-0041] lists every record", async () => {
    const r = await call(app, LIST, {
      url: "/api/supplier/inventory",
      cookies: await cookies(app),
    });
    expect(r.body).toEqual([
      { itemId: "EST-1", quantity: 40 },
      { itemId: "EST-2", quantity: 0 },
      { itemId: "EST-3", quantity: 12 },
    ]);
  });

  it("[SWHR2-C-0042] saves only marked rows; blank and unmarked rows are ignored", async () => {
    const r = await post(app, await cookies(app), {
      rows: [
        { itemId: "EST-1", quantity: "30", marked: true },
        { itemId: "EST-2", quantity: 15, marked: false },
        { itemId: "EST-3", quantity: "", marked: true },
      ],
    });
    expect(r.status).toBe(200);
    expect([qty(app, "EST-1"), qty(app, "EST-2"), qty(app, "EST-3")]).toEqual([30, 0, 12]);
    expect(msgs(app)).toHaveLength(1);
  });

  it("[SWHR2-C-0043] saves two marked rows together", async () => {
    const r = await post(app, await cookies(app), {
      rows: [
        { itemId: "EST-1", quantity: 50, marked: true },
        { itemId: "EST-2", quantity: 20, marked: true },
        { itemId: "EST-3", quantity: 12, marked: false },
      ],
    });
    expect(r.status).toBe(200);
    expect([qty(app, "EST-1"), qty(app, "EST-2"), qty(app, "EST-3")]).toEqual([50, 20, 12]);
  });

  it("[SWHR2-C-0043] an invalid marked quantity saves nothing", async () => {
    for (const bad of [-1, 1.5, "abc"]) {
      const r = await post(app, await cookies(app), {
        rows: [
          { itemId: "EST-1", quantity: 50, marked: true },
          { itemId: "EST-2", quantity: bad, marked: true },
        ],
      });
      expect(r.status).toBe(400);
    }
    expect(qty(app, "EST-1")).toBe(40);
    expect(msgs(app)).toHaveLength(0);
  });

  it("[SWHR2-C-0043] a body without rows is 400", async () => {
    expect((await post(app, await cookies(app), {})).status).toBe(400);
  });
});
