// @vitest-environment node
import { describe, expect, it } from "vitest";

import { loadOrders } from "./approvalHarness";

async function seed() {
  const app = await loadOrders();
  const po = (id: string) =>
    app.client.exec(
      `insert into op_purchase_orders values ('${id}','j2ee','en_US',${Date.UTC(2002, 2, 5, 12)},0,'a','b','c','d','e','f','g','h','i')`,
    );
  const line = (id: string, n: number, cat: string, item: string, qty: number, price: number) =>
    app.client.exec(
      `insert into op_po_line_items (order_id,line_number,category_id,product_id,item_id,quantity,unit_price) values ('${id}',${n},'${cat}','P','${item}',${qty},${price})`,
    );
  po("5001");
  line("5001", 1, "FISH", "EST-1", 2, 1000);
  line("5001", 2, "FISH", "EST-2", 1, 1500);
  po("5002");
  line("5002", 1, "DOGS", "EST-6", 3, 2000);
  const { salesByCategory } = await import("./sales");
  return salesByCategory;
}
const byKey = (rows: { key: string; value: number }[]) =>
  Object.fromEntries(rows.map((r) => [r.key, r.value]));

describe("salesByCategory", () => {
  it("[SWHR2-C-0001] a named category breaks revenue down per item of that category", async () => {
    const sales = await seed();
    expect(byKey(sales("revenue", "2001-01-01", "2002-12-31", "FISH"))).toEqual({
      "EST-1": 20,
      "EST-2": 15,
    });
  });

  it("[SWHR2-C-0002] no category gives revenue per category", async () => {
    const sales = await seed();
    expect(byKey(sales("revenue", "2001-01-01", "2002-12-31"))).toEqual({ FISH: 35, DOGS: 60 });
  });

  it("[SWHR2-C-0001] a named category breaks the order count down per item", async () => {
    const sales = await seed();
    expect(byKey(sales("count", "2001-01-01", "2002-12-31", "FISH"))).toEqual({
      "EST-1": 1,
      "EST-2": 1,
    });
  });
});
