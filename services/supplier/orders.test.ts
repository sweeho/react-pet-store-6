// @vitest-environment node
import { describe, expect, it } from "vitest";

import { count, fulfilment, supplierOrder } from "../../tests/acceptance/order-fulfillment/harness";

describe("supplier orders", () => {
  it("[SWHR2-C-0102] status is restricted to four values", async () => {
    const f = await fulfilment();
    f.supplier.createSupplierOrder(f.db, supplierOrder("10011"));
    for (const [i, s] of ["APPROVED", "DENIED", "COMPLETED"].entries())
      f.client.exec(
        `insert into sup_orders (order_id, status, order_date, user_id) values ('2000${i}', '${s}', '2003-04-15', 'j2ee')`,
      );
    expect(() =>
      f.client.exec(
        "insert into sup_orders (order_id, status, order_date, user_id) values ('29999', 'SHIPPED', '2003-04-15', 'j2ee')",
      ),
    ).toThrow(/CHECK/i);
  });

  it("[SWHR2-C-0124] a duplicate id is rejected, stored order unchanged", async () => {
    const f = await fulfilment();
    f.supplier.createSupplierOrder(f.db, supplierOrder("10011", [["EST-1", 3]]));
    expect(() =>
      f.supplier.createSupplierOrder(f.db, supplierOrder("10011", [["EST-2", 1]])),
    ).toThrow();
    expect(f.client.query("select item_id, quantity from sup_order_lines").all()).toEqual([
      { item_id: "EST-1", quantity: 3 },
    ]);
  });

  it("[SWHR2-C-0125] a new order is PENDING", async () => {
    const f = await fulfilment();
    f.supplier.createSupplierOrder(f.db, supplierOrder("10011"));
    expect(f.client.query("select status from sup_orders").get()).toEqual({ status: "PENDING" });
  });

  it("[SWHR2-C-0126] a line is copied with shipped 0", async () => {
    const f = await fulfilment();
    f.supplier.createSupplierOrder(f.db, supplierOrder("10011", [["EST-1", 3]]));
    const l = f.client.query("select * from sup_order_lines").get() as Record<string, unknown>;
    expect([
      l.category_id,
      l.product_id,
      l.item_id,
      l.line_number,
      l.quantity,
      l.unit_price,
      l.quantity_shipped,
    ]).toEqual(["FISH", "FI-SW-01", "EST-1", 1, 3, 1650, 0]);
  });

  it("[SWHR2-C-0127] deleting an order cascades", async () => {
    const f = await fulfilment();
    f.supplier.createSupplierOrder(
      f.db,
      supplierOrder("10011", [
        ["EST-1", 1],
        ["EST-2", 1],
      ]),
    );
    expect(count(f.client, "sup_order_contacts")).toBe(1);
    f.client.exec("delete from sup_orders where order_id = '10011'");
    expect(count(f.client, "sup_order_contacts")).toBe(0);
    expect(count(f.client, "sup_order_lines")).toBe(0);
  });

  it("[SWHR2-C-0128] a failing third line stores nothing", async () => {
    const f = await fulfilment();
    const input = supplierOrder("10011", [
      ["EST-1", 1],
      ["EST-2", 1],
      ["EST-3", 1],
    ]);
    (input.lines[2] as Record<string, unknown>).itemId = null;
    expect(() => f.supplier.createSupplierOrder(f.db, input)).toThrow();
    for (const t of ["sup_orders", "sup_order_contacts", "sup_order_lines"])
      expect(count(f.client, t)).toBe(0);
  });

  it("[SWHR2-C-0144] lists pending orders once each", async () => {
    const f = await fulfilment();
    for (const id of ["20001", "20002", "20003"])
      f.supplier.createSupplierOrder(
        f.db,
        supplierOrder(id, [
          ["EST-1", 1],
          ["EST-2", 1],
        ]),
      );
    for (const id of ["20004", "20005"]) {
      f.supplier.createSupplierOrder(f.db, supplierOrder(id));
      f.client.exec(`update sup_orders set status = 'COMPLETED' where order_id = '${id}'`);
    }
    expect(
      f.supplier
        .listSupplierOrders("PENDING")
        .map((o: { orderId: string }) => o.orderId)
        .sort(),
    ).toEqual(["20001", "20002", "20003"]);
  });
});
