// @vitest-environment node
import { describe, expect, it } from "vitest";

import { adminCookies, call } from "../order-approval/harness";
import { purchaseOrder } from "../checkout/harness";
import { loadApp } from "../sign-on/harness";

type App = Awaited<ReturnType<typeof loadApp>>;
type Line = [categoryId: string, itemId: string, quantity: number, unitPriceHundredths: number];

/** Stores an order (through the order receipt service) with the given lines, status and date. */
async function seedOrder(
  app: App,
  orderId: string,
  status: string,
  lines: Line[],
  date = Date.UTC(2002, 2, 5, 12),
) {
  const { createPurchaseOrder } = await import("../../../services/orders/receive");
  const base = purchaseOrder(orderId);
  const po = {
    ...base,
    orderDate: date,
    total: lines.reduce((s, l) => s + l[2] * l[3], 0),
    lines: lines.map(([categoryId, itemId, quantity, unitPrice], i) => ({
      ...base.lines[0],
      lineNumber: i + 1,
      categoryId,
      itemId,
      quantity,
      unitPrice,
    })),
  };
  await createPurchaseOrder(app.db, po);
  app.client.exec(
    `insert into op_order_workflow (order_id, status) values ('${orderId}', '${status}')`,
  );
}

const get = async (app: App, route: string, url: string) =>
  call(app, `../../../routes/api/admin/${route}`, { url, cookies: await adminCookies(app) });
const entries = (body: unknown) =>
  Object.fromEntries(
    (body as { key: string; value: number | string }[]).map((r) => [r.key, Number(r.value)]),
  );

async function revenueApp() {
  const app = await loadApp();
  await seedOrder(app, "5001", "APPROVED", [
    ["FISH", "EST-1", 2, 1000],
    ["FISH", "EST-2", 1, 1500],
  ]);
  await seedOrder(app, "5002", "APPROVED", [["DOGS", "EST-6", 3, 2000]]);
  return app;
}
const REV = "/api/admin/sales/revenue?start=2001-01-01&end=2002-12-31";

describe("revenue report", () => {
  // case: SWHR2-C-0001@v1
  it("SWHR2-C-0001: a revenue request naming FISH returns per-item revenue for FISH items only", async () => {
    const app = await revenueApp();
    const r = await get(app, "sales/revenue.get", `${REV}&category=FISH`);
    expect(r.status).toBe(200);
    expect(entries(r.body)).toEqual({ "EST-1": 20, "EST-2": 15 });
  });

  // case: SWHR2-C-0002@v1
  it("SWHR2-C-0002: a revenue request with no category returns revenue per category", async () => {
    const app = await revenueApp();
    const r = await get(app, "sales/revenue.get", REV);
    expect(r.status).toBe(200);
    expect(entries(r.body)).toEqual({ FISH: 35, DOGS: 60 });
  });
});

describe("orders by status", () => {
  const list = async (app: App, status: string) => {
    const r = await get(app, "orders/index.get", `/api/admin/orders?status=${status}`);
    expect(r.status).toBe(200);
    return r.body as { id: string; userId: string; date: string; amount: number; status: string }[];
  };

  // case: SWHR2-C-0012@v1
  it("SWHR2-C-0012: orders-by-status APPROVED returns order 1001 with all its detail fields", async () => {
    const app = await loadApp();
    await seedOrder(app, "1001", "APPROVED", [["FISH", "EST-1", 1, 12050]]);
    const o = (await list(app, "APPROVED")).find((x) => String(x.id) === "1001");
    expect(o).toMatchObject({ userId: "j2ee", date: "3/5/2002", status: "APPROVED" });
    expect(Number(o?.amount)).toBe(120.5);
  });

  // case: SWHR2-C-0013@v1
  it("SWHR2-C-0013: orders-by-status DENIED returns an empty list when none are denied", async () => {
    const app = await loadApp();
    await seedOrder(app, "1", "PENDING", [["FISH", "EST-1", 1, 1000]]);
    await seedOrder(app, "2", "APPROVED", [["FISH", "EST-1", 1, 1000]]);
    expect(await list(app, "DENIED")).toEqual([]);
  });

  // case: SWHR2-C-0014@v1
  it("SWHR2-C-0014: orders-by-status PENDING returns exactly the three pending orders, once each", async () => {
    const app = await loadApp();
    const many: Line[] = [
      ["FISH", "EST-1", 1, 1000],
      ["FISH", "EST-2", 2, 1500],
    ];
    for (const id of ["2001", "2002", "2003"]) await seedOrder(app, id, "PENDING", many);
    for (const id of ["2004", "2005"]) await seedOrder(app, id, "APPROVED", many);
    const ids = (await list(app, "PENDING")).map((o) => String(o.id)).sort();
    expect(ids).toEqual(["2001", "2002", "2003"]);
  });

  // case: SWHR2-C-0015@v1
  it("SWHR2-C-0015: the status match is case-sensitive, so 'approved' returns no APPROVED orders", async () => {
    const app = await loadApp();
    for (const id of ["3001", "3002"])
      await seedOrder(app, id, "APPROVED", [["FISH", "EST-1", 1, 1000]]);
    expect(await list(app, "approved")).toEqual([]);
  });
});
