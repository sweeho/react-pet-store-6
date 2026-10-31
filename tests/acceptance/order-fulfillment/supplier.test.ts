// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  approvalXml,
  count,
  dropFailure,
  failPublishing,
  fulfilment,
  messages,
  purchaseOrder,
  statusOf,
  supplierOrder,
} from "./harness";

describe("supplier orders", () => {
  // case: SWHR2-C-0102@v1
  it("SWHR2-C-0102: supplier order status is restricted to PENDING, APPROVED, DENIED or COMPLETED", async () => {
    const f = await fulfilment();
    let n = 20000;
    for (const s of ["PENDING", "APPROVED", "DENIED", "COMPLETED"])
      f.client.exec(
        `insert into sup_orders (order_id, status, order_date, user_id) values ('${n++}', '${s}', '2003-04-15', 'j2ee')`,
      );
    const stored = (
      f.client.query("select status from sup_orders").all() as { status: string }[]
    ).map((r) => r.status);
    expect(stored.sort()).toEqual(["APPROVED", "COMPLETED", "DENIED", "PENDING"]);
    expect(() =>
      f.client.exec(
        "insert into sup_orders (order_id, status, order_date, user_id) values ('29999', 'SHIPPED', '2003-04-15', 'j2ee')",
      ),
    ).toThrow(/CHECK/i);
  });

  // case: SWHR2-C-0117@v1
  it("SWHR2-C-0117: exactly one consumer receives the purchase order for 10011 and the supplier order carries its address and lines", async () => {
    const f = await fulfilment();
    f.setStock("EST-1", 0);
    f.setStock("EST-2", 0);
    f.messaging.enqueue(
      f.db,
      "supplier.purchase-order",
      f.docs.buildSupplierOrder(
        supplierOrder("10011", [
          ["EST-1", 3],
          ["EST-2", 1],
        ]),
      ),
    );
    expect(messages(f.client, "supplier.purchase-order")).toHaveLength(1);
    await f.drain();
    expect(
      messages(f.client, "supplier.purchase-order").filter((m) => m.status === "delivered"),
    ).toHaveLength(1);
    expect(count(f.client, "sup_orders", "order_id = '10011'")).toBe(1);
    expect(count(f.client, "sup_order_lines", "order_id = '10011'")).toBe(2);
    expect(
      JSON.stringify(
        f.client.query("select * from sup_order_contacts where order_id = '10011'").all(),
      ),
    ).toContain("1 Main St");
  });

  // case: SWHR2-C-0119@v1
  it("SWHR2-C-0119: when the supplier ships an approved order it sends an invoice to order processing", async () => {
    const f = await fulfilment();
    await f.approvedOrder("10018", [["EST-1", 2]]);
    f.setStock("EST-1", 10);
    f.messaging.enqueue(
      f.db,
      "supplier.purchase-order",
      f.docs.buildSupplierOrder(supplierOrder("10018", [["EST-1", 2]])),
    );
    await f.drain();
    const inv = messages(f.client, "supplier.invoice", "%10018%").filter(
      (m) => m.subscriber === "order-processing.invoice",
    );
    expect(inv).toHaveLength(1);
    expect(inv[0].status).toBe("delivered");
    expect(inv[0].payload).toContain("EST-1");
  });

  // case: SWHR2-C-0113@v1
  it("SWHR2-C-0113: if publishing the invoice fails, receiving the purchase order is rolled back and redelivered", async () => {
    const f = await fulfilment();
    f.setStock("EST-1", 10);
    f.messaging.enqueue(
      f.db,
      "supplier.purchase-order",
      f.docs.buildSupplierOrder(supplierOrder("10014", [["EST-1", 2]])),
    );
    failPublishing(f.client, "supplier.invoice");
    await f.worker.processDue();
    expect(count(f.client, "sup_orders", "order_id = '10014'")).toBe(0);
    expect(f.stock("EST-1")).toBe(10);
    const po = messages(f.client, "supplier.purchase-order");
    expect(po).toHaveLength(1);
    expect(po[0].status).toBe("pending");
    expect(po[0].attempts).toBeGreaterThan(0);
    dropFailure(f.client, "supplier.invoice");
  });

  // case: SWHR2-C-0120@v1
  it("SWHR2-C-0120: adding stock of EST-1 completes an order that was waiting for it", async () => {
    const f = await fulfilment();
    f.setStock("EST-1", 0);
    await f.supplier.createSupplierOrder(f.db, supplierOrder("10019", [["EST-1", 3]]));
    f.setStock("EST-1", 10);
    f.messaging.enqueue(f.db, "supplier.inventory-changed", JSON.stringify({ itemIds: ["EST-1"] }));
    await f.drain();
    expect(f.client.query("select status from sup_orders where order_id = '10019'").get()).toEqual({
      status: "COMPLETED",
    });
    expect(f.stock("EST-1")).toBe(7);
    expect(messages(f.client, "supplier.invoice", "%10019%").length).toBeGreaterThan(0);
  });

  // case: SWHR2-C-0121@v1
  it("SWHR2-C-0121: adding too little stock of EST-1 leaves the waiting order not completed", async () => {
    const f = await fulfilment();
    f.setStock("EST-1", 0);
    await f.supplier.createSupplierOrder(f.db, supplierOrder("10020", [["EST-1", 5]]));
    f.setStock("EST-1", 2);
    f.messaging.enqueue(f.db, "supplier.inventory-changed", JSON.stringify({ itemIds: ["EST-1"] }));
    await f.drain();
    expect(
      (
        f.client.query("select status from sup_orders where order_id = '10020'").get() as {
          status: string;
        }
      ).status,
    ).not.toBe("COMPLETED");
    expect(f.stock("EST-1")).toBe(2);
  });

  // case: SWHR2-C-0122@v1
  it("SWHR2-C-0122: an order shipped in two parts gets one invoice per shipment and completes after the second", async () => {
    const f = await fulfilment();
    await f.approvedOrder("10021", [
      ["EST-1", 1],
      ["EST-2", 1],
    ]);
    f.setStock("EST-1", 5);
    f.setStock("EST-2", 0);
    const invoices = () =>
      messages(f.client, "supplier.invoice", "%10021%").filter(
        (m) => m.subscriber === "order-processing.invoice",
      );
    f.messaging.enqueue(
      f.db,
      "supplier.purchase-order",
      f.docs.buildSupplierOrder(
        supplierOrder("10021", [
          ["EST-1", 1],
          ["EST-2", 1],
        ]),
      ),
    );
    await f.drain();
    expect(invoices()).toHaveLength(1);
    expect(invoices()[0].payload).toContain("EST-1");
    expect(statusOf(f.client, "10021")).not.toBe("COMPLETED");
    f.setStock("EST-2", 3);
    f.messaging.enqueue(f.db, "supplier.inventory-changed", JSON.stringify({ itemIds: ["EST-2"] }));
    await f.drain();
    expect(invoices()).toHaveLength(2);
    expect(invoices()[1].payload).toContain("EST-2");
    expect(statusOf(f.client, "10021")).toBe("COMPLETED");
  });

  // case: SWHR2-C-0124@v1
  it("SWHR2-C-0124: creating a second supplier order with id 10011 is rejected and the stored order is unchanged", async () => {
    const f = await fulfilment();
    await f.supplier.createSupplierOrder(f.db, supplierOrder("10011", [["EST-1", 3]]));
    await expect(
      Promise.resolve().then(() =>
        f.supplier.createSupplierOrder(f.db, supplierOrder("10011", [["EST-2", 1]])),
      ),
    ).rejects.toBeDefined();
    expect(
      f.client
        .query("select item_id, quantity from sup_order_lines where order_id = '10011'")
        .all(),
    ).toEqual([{ item_id: "EST-1", quantity: 3 }]);
  });

  // case: SWHR2-C-0125@v1
  it("SWHR2-C-0125: a newly created supplier order is PENDING", async () => {
    const f = await fulfilment();
    await f.supplier.createSupplierOrder(f.db, supplierOrder("10011"));
    expect(f.client.query("select status from sup_orders").get()).toEqual({ status: "PENDING" });
  });

  // case: SWHR2-C-0126@v1
  it("SWHR2-C-0126: a supplier order line is copied with the same values and starts with quantity shipped 0", async () => {
    const f = await fulfilment();
    await f.supplier.createSupplierOrder(f.db, supplierOrder("10011", [["EST-1", 3]]));
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

  // case: SWHR2-C-0127@v1
  it("SWHR2-C-0127: deleting a supplier order also deletes its shipping contact and line items", async () => {
    const f = await fulfilment();
    await f.supplier.createSupplierOrder(
      f.db,
      supplierOrder("10011", [
        ["EST-1", 1],
        ["EST-2", 1],
      ]),
    );
    // the shipping address is held in the contact row, so no stored row may still carry it
    const holdsAddress = () =>
      (
        f.client
          .query("select name from sqlite_master where type = 'table' and name like 'sup_%'")
          .all() as { name: string }[]
      ).filter((t) =>
        JSON.stringify(f.client.query(`select * from ${t.name}`).all()).includes("1 Main St"),
      );
    expect(holdsAddress().map((t) => t.name)).toContain("sup_order_contacts");
    f.client.exec("delete from sup_orders where order_id = '10011'");
    expect(count(f.client, "sup_order_contacts")).toBe(0);
    expect(count(f.client, "sup_order_lines")).toBe(0);
    expect(holdsAddress()).toEqual([]);
  });

  // case: SWHR2-C-0128@v1
  it("SWHR2-C-0128: if the third line cannot be stored nothing from the supplier order is stored", async () => {
    const f = await fulfilment();
    const input = supplierOrder("10011", [
      ["EST-1", 1],
      ["EST-2", 1],
      ["EST-3", 1],
    ]);
    (input.lines[2] as Record<string, unknown>).itemId = null;
    await expect(
      Promise.resolve().then(() => f.supplier.createSupplierOrder(f.db, input)),
    ).rejects.toBeDefined();
    for (const t of ["sup_orders", "sup_order_contacts", "sup_order_lines"])
      expect(count(f.client, t)).toBe(0);
  });

  // case: SWHR2-C-0143@v1
  it("SWHR2-C-0143: if sending the supplier purchase order fails, the approval of 10011 is rolled back and the batch retried", async () => {
    const f = await fulfilment();
    await f.receive.createPurchaseOrder(f.db, purchaseOrder("10011", [["EST-1", 1]]));
    f.client.exec("insert into op_order_workflow (order_id, status) values ('10011', 'PENDING')");
    f.messaging.enqueue(f.db, "order.approval", approvalXml("10011", "APPROVED"));
    failPublishing(f.client, "supplier.purchase-order");
    await f.worker.processDue();
    expect(statusOf(f.client, "10011")).toBe("PENDING");
    expect(messages(f.client, "supplier.purchase-order")).toEqual([]);
    expect(messages(f.client, "order.approval")[0].status).toBe("pending");
    dropFailure(f.client, "supplier.purchase-order");
    await f.drain();
    expect(statusOf(f.client, "10011")).toBe("APPROVED");
    expect(messages(f.client, "supplier.purchase-order")).toHaveLength(1);
  });

  // case: SWHR2-C-0144@v1
  it("SWHR2-C-0144: listing supplier orders with status PENDING returns exactly the three pending orders", async () => {
    const f = await fulfilment();
    for (const id of ["20001", "20002", "20003"])
      await f.supplier.createSupplierOrder(
        f.db,
        supplierOrder(id, [
          ["EST-1", 1],
          ["EST-2", 1],
          ["EST-3", 1],
        ]),
      );
    for (const id of ["20004", "20005"]) {
      await f.supplier.createSupplierOrder(f.db, supplierOrder(id, [["EST-1", 1]]));
      f.client.exec(`update sup_orders set status = 'COMPLETED' where order_id = '${id}'`);
    }
    const got = (await f.supplier.listSupplierOrders("PENDING")) as Record<string, unknown>[];
    expect(got.map((o) => String(o.orderId ?? o.order_id)).sort()).toEqual([
      "20001",
      "20002",
      "20003",
    ]);
  });
});
