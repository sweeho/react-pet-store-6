// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  count,
  dropFailure,
  failPublishing,
  fulfilment,
  messages,
  statusOf,
  supplierOrder,
  purchaseOrder,
  approvalXml,
} from "../../tests/acceptance/order-fulfillment/harness";

const po = (f: Awaited<ReturnType<typeof fulfilment>>, id: string, lines: [string, number][]) =>
  f.messaging.enqueue(
    f.db,
    "supplier.purchase-order",
    f.docs.buildSupplierOrder(supplierOrder(id, lines)),
  );
const invoicesFor = (f: Awaited<ReturnType<typeof fulfilment>>, id: string) =>
  messages(f.client, "supplier.invoice", `%${id}%`).filter(
    (m) => m.subscriber === "order-processing.invoice",
  );

describe("purchase order receipt", () => {
  it("[SWHR2-C-0117] one consumer builds the supplier order", async () => {
    const f = await fulfilment();
    f.setStock("EST-1", 0);
    f.setStock("EST-2", 0);
    po(f, "10011", [
      ["EST-1", 3],
      ["EST-2", 1],
    ]);
    await f.drain();
    expect(
      messages(f.client, "supplier.purchase-order").filter((m) => m.status === "delivered"),
    ).toHaveLength(1);
    expect(count(f.client, "sup_order_lines", "order_id = '10011'")).toBe(2);
    expect(JSON.stringify(f.client.query("select * from sup_order_contacts").all())).toContain(
      "1 Main St",
    );
  });

  it("[SWHR2-C-0119] shipping sends an invoice to order processing", async () => {
    const f = await fulfilment();
    await f.approvedOrder("10018", [["EST-1", 2]]);
    f.setStock("EST-1", 10);
    po(f, "10018", [["EST-1", 2]]);
    await f.drain();
    expect(invoicesFor(f, "10018")).toHaveLength(1);
    expect(invoicesFor(f, "10018")[0].status).toBe("delivered");
  });

  it("[SWHR2-C-0113] a failed invoice publish rolls the receipt back", async () => {
    const f = await fulfilment();
    f.setStock("EST-1", 10);
    po(f, "10014", [["EST-1", 2]]);
    failPublishing(f.client, "supplier.invoice");
    await f.worker.processDue();
    expect(count(f.client, "sup_orders")).toBe(0);
    expect(f.stock("EST-1")).toBe(10);
    const row = messages(f.client, "supplier.purchase-order")[0];
    expect([row.status, row.attempts > 0]).toEqual(["pending", true]);
    dropFailure(f.client, "supplier.invoice");
    await f.drain();
    expect(f.stock("EST-1")).toBe(8);
    expect(count(f.client, "sup_orders")).toBe(1);
  });

  it("[SWHR2-C-0120] a restock completes a waiting order", async () => {
    const f = await fulfilment();
    f.setStock("EST-1", 0);
    f.supplier.createSupplierOrder(f.db, supplierOrder("10019", [["EST-1", 3]]));
    f.setStock("EST-1", 10);
    f.messaging.enqueue(f.db, "supplier.inventory-changed", JSON.stringify({ itemIds: ["EST-1"] }));
    await f.drain();
    expect(f.client.query("select status from sup_orders").get()).toEqual({ status: "COMPLETED" });
    expect(f.stock("EST-1")).toBe(7);
  });

  it("[SWHR2-C-0121] too little stock leaves the order waiting", async () => {
    const f = await fulfilment();
    f.setStock("EST-1", 0);
    f.supplier.createSupplierOrder(f.db, supplierOrder("10020", [["EST-1", 5]]));
    f.setStock("EST-1", 2);
    f.messaging.enqueue(f.db, "supplier.inventory-changed", JSON.stringify({ itemIds: ["EST-1"] }));
    await f.drain();
    expect(f.client.query("select status from sup_orders").get()).toEqual({ status: "PENDING" });
    expect(f.stock("EST-1")).toBe(2);
  });

  it("[SWHR2-C-0122] two shipments, one invoice each, complete after the second", async () => {
    const f = await fulfilment();
    await f.approvedOrder("10021", [
      ["EST-1", 1],
      ["EST-2", 1],
    ]);
    f.setStock("EST-1", 5);
    f.setStock("EST-2", 0);
    po(f, "10021", [
      ["EST-1", 1],
      ["EST-2", 1],
    ]);
    await f.drain();
    expect(invoicesFor(f, "10021")).toHaveLength(1);
    expect(statusOf(f.client, "10021")).toBe("SHIPPED_PART");
    f.setStock("EST-2", 3);
    f.messaging.enqueue(f.db, "supplier.inventory-changed", JSON.stringify({ itemIds: ["EST-2"] }));
    await f.drain();
    expect(invoicesFor(f, "10021")).toHaveLength(2);
    expect(statusOf(f.client, "10021")).toBe("COMPLETED");
  });

  it("[SWHR2-C-0143] a failed purchase order send rolls the approval back", async () => {
    const f = await fulfilment();
    await f.receive.createPurchaseOrder(f.db, purchaseOrder("10011", [["EST-1", 1]]));
    f.client.exec("insert into op_order_workflow (order_id, status) values ('10011', 'PENDING')");
    f.messaging.enqueue(f.db, "order.approval", approvalXml("10011", "APPROVED"));
    failPublishing(f.client, "supplier.purchase-order");
    await f.worker.processDue();
    expect(statusOf(f.client, "10011")).toBe("PENDING");
    expect(messages(f.client, "order.approval")[0].status).toBe("pending");
    dropFailure(f.client, "supplier.purchase-order");
    await f.drain();
    expect(statusOf(f.client, "10011")).toBe("APPROVED");
    expect(messages(f.client, "supplier.purchase-order")).toHaveLength(1);
  });
});
