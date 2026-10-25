// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";

import { call, cookieValue, loadApp, SUPPLIER } from "../sign-on/harness";

type App = Awaited<ReturnType<typeof loadApp>>;
type Row = { itemId: string; quantity: number };

const LIST = "../../../routes/api/supplier/inventory.get";
const UPDATE = "../../../routes/api/supplier/inventory.post";

const seed = (app: App, rows: [string, number][]) =>
  rows.forEach(([id, q]) =>
    app.client.exec(
      `insert or replace into sup_inventory (item_id, quantity) values ('${id}', ${q})`,
    ),
  );
const qty = (app: App, id: string) =>
  (
    app.client.query("select quantity q from sup_inventory where item_id = ?").get(id) as {
      q: number;
    } | null
  )?.q;

async function supplierCookies(app: App) {
  const r = await call(app, "../../../routes/api/supplier/sign-in.post", {
    method: "POST",
    url: "/api/supplier/sign-in",
    json: SUPPLIER,
  });
  expect(r.status).toBe(200);
  return { supplier_sid: cookieValue(r.setCookies, "supplier_sid") ?? "" };
}
const submit = (app: App, cookies: Record<string, string>, rows: object[]) =>
  call(app, UPDATE, { method: "POST", url: "/api/supplier/inventory", cookies, json: { rows } });

describe("inventory update submission", () => {
  let app: App;
  beforeEach(async () => {
    app = await loadApp();
  });

  // case: SWHR2-C-0043@v1
  it("SWHR2-C-0043: one submission with two marked rows saves both together and leaves the unmarked row unchanged", async () => {
    seed(app, [
      ["EST-1", 40],
      ["EST-2", 0],
      ["EST-3", 12],
    ]);
    const cookies = await supplierCookies(app);
    const ok = await submit(app, cookies, [
      { itemId: "EST-1", quantity: 50, marked: true },
      { itemId: "EST-2", quantity: 20, marked: true },
      { itemId: "EST-3", quantity: 12, marked: false },
    ]);
    expect(ok.status).toBe(200);
    expect([qty(app, "EST-1"), qty(app, "EST-2"), qty(app, "EST-3")]).toEqual([50, 20, 12]);
    const list = await call(app, LIST, { url: "/api/supplier/inventory", cookies });
    const byId = Object.fromEntries((list.body as Row[]).map((r) => [r.itemId, r.quantity]));
    expect([byId["EST-1"], byId["EST-2"], byId["EST-3"]]).toEqual([50, 20, 12]);
  });

  // case: SWHR2-C-0043@v1
  it("SWHR2-C-0043: a submission with one invalid marked row saves nothing", async () => {
    seed(app, [
      ["EST-1", 40],
      ["EST-2", 0],
      ["EST-3", 12],
    ]);
    const cookies = await supplierCookies(app);
    const bad = await submit(app, cookies, [
      { itemId: "EST-1", quantity: 50, marked: true },
      { itemId: "EST-2", quantity: 2.5, marked: true },
    ]);
    expect(bad.status).toBe(400);
    expect([qty(app, "EST-1"), qty(app, "EST-2"), qty(app, "EST-3")]).toEqual([40, 0, 12]);
  });
});

describe("stock record rules", () => {
  // case: SWHR2-C-0044@v1
  it("SWHR2-C-0044: creating a second stock record for EST-1 is refused and the existing record is unchanged", async () => {
    const app = await loadApp();
    seed(app, [["EST-1", 40]]);
    expect(() =>
      app.client.exec("insert into sup_inventory (item_id, quantity) values ('EST-1', 99)"),
    ).toThrow(/unique|primary key|constraint/i);
    const rows = app.client
      .query("select quantity from sup_inventory where item_id = 'EST-1'")
      .all();
    expect(rows).toEqual([{ quantity: 40 }]);
  });

  // case: SWHR2-C-0045@v1
  it("SWHR2-C-0045: saving a new stock record for EST-2 without a quantity is refused", async () => {
    const app = await loadApp();
    expect(() =>
      app.client.exec("insert into sup_inventory (item_id, quantity) values ('EST-2', null)"),
    ).toThrow(/not null|constraint/i);
    expect(() => app.client.exec("insert into sup_inventory (item_id) values ('EST-2')")).toThrow(
      /not null|constraint/i,
    );
    expect(app.client.query("select * from sup_inventory where item_id = 'EST-2'").all()).toEqual(
      [],
    );
  });
});
