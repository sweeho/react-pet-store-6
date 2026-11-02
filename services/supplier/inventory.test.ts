// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";

import { loadApp } from "../customers/testHarness";
import { listInventory } from "./inventory";

type App = Awaited<ReturnType<typeof loadApp>>;
type Svc = typeof import("./inventory");

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
const messages = (app: App) =>
  app.client
    .query("select payload, status from messages where channel = 'supplier.inventory-changed'")
    .all() as { payload: string; status: string }[];

describe("supplier inventory service", () => {
  let app: App;
  let svc: Svc;
  beforeEach(async () => {
    app = await loadApp();
    svc = await import("./inventory");
  });

  it("[SWHR2-C-0043] overwrites every change together and enqueues one message", () => {
    seed(app, [
      ["EST-1", 40],
      ["EST-2", 0],
      ["EST-3", 12],
    ]);
    svc.updateInventory([
      { itemId: "EST-1", quantity: 50 },
      { itemId: "EST-2", quantity: 20 },
    ]);
    expect([qty(app, "EST-1"), qty(app, "EST-2"), qty(app, "EST-3")]).toEqual([50, 20, 12]);
    const m = messages(app);
    expect(m).toHaveLength(1);
    expect(JSON.parse(m[0].payload)).toEqual({ itemIds: ["EST-1", "EST-2"] });
  });

  it("[SWHR2-C-0043] creates a missing record and accepts zero", () => {
    svc.updateInventory([{ itemId: "EST-9", quantity: 0 }]);
    expect(qty(app, "EST-9")).toBe(0);
  });

  it("[SWHR2-C-0043] enqueues nothing for an empty change list", () => {
    svc.updateInventory([]);
    expect(messages(app)).toHaveLength(0);
  });

  it("[SWHR2-C-0043] rolls the stock back when the message cannot be enqueued", () => {
    seed(app, [["EST-1", 40]]);
    app.client.exec(
      "create trigger fail_msg before insert on messages begin select raise(abort, 'boom'); end",
    );
    expect(() => svc.updateInventory([{ itemId: "EST-1", quantity: 50 }])).toThrow();
    expect(qty(app, "EST-1")).toBe(40);
  });

  it("[SWHR2-C-0041] lists records in natural item order", () => {
    seed(app, [
      ["EST-10", 1],
      ["EST-2", 2],
      ["EST-1", 3],
    ]);
    expect(svc.listInventory().map((r) => r.itemId)).toEqual(["EST-1", "EST-2", "EST-10"]);
  });

  it("reduceStock subtracts when stock suffices, including exactly", async () => {
    seed(app, [["EST-1", 5]]);
    const { db } = await import("../../db/client");
    expect(svc.reduceStock(db, "EST-1", 2)).toBe(true);
    expect(qty(app, "EST-1")).toBe(3);
    expect(svc.reduceStock(db, "EST-1", 3)).toBe(true);
    expect(qty(app, "EST-1")).toBe(0);
  });

  it("reduceStock leaves short or missing stock untouched", async () => {
    seed(app, [["EST-1", 2]]);
    const { db } = await import("../../db/client");
    expect(svc.reduceStock(db, "EST-1", 3)).toBe(false);
    expect(qty(app, "EST-1")).toBe(2);
    expect(svc.reduceStock(db, "EST-7", 1)).toBe(false);
  });
});

describe("stock record rules", () => {
  it("[SWHR2-C-0044] refuses a second record for the same item", async () => {
    const app = await loadApp();
    seed(app, [["EST-1", 40]]);
    expect(() =>
      app.client.exec("insert into sup_inventory (item_id, quantity) values ('EST-1', 99)"),
    ).toThrow(/unique|primary key|constraint/i);
    expect(qty(app, "EST-1")).toBe(40);
  });

  it("[SWHR2-C-0045] refuses a record without a quantity", async () => {
    const app = await loadApp();
    listInventory();
    expect(() =>
      app.client.exec("insert into sup_inventory (item_id, quantity) values ('EST-2', null)"),
    ).toThrow(/not null|constraint/i);
    expect(qty(app, "EST-2")).toBeUndefined();
  });
});
