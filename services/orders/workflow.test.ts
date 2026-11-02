// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  approvalXml,
  count,
  fulfilment,
  messages,
  purchaseOrder,
  statusOf,
} from "./fulfilmentHarness";

const pending = (f: Awaited<ReturnType<typeof fulfilment>>, id: string) =>
  f.client.exec(`insert into op_order_workflow (order_id, status) values ('${id}', 'PENDING')`);

describe("workflow record", () => {
  it("[SWHR2-C-0131] starts a workflow PENDING", async () => {
    const f = await fulfilment();
    f.workflow.startWorkflow(f.db, "10011", "PENDING");
    expect(statusOf(f.client, "10011")).toBe("PENDING");
  });

  it("[SWHR2-C-0132] a second start fails and leaves the record unchanged", async () => {
    const f = await fulfilment();
    f.client.exec("insert into op_order_workflow (order_id, status) values ('10011', 'APPROVED')");
    expect(() => f.workflow.startWorkflow(f.db, "10011", "PENDING")).toThrow();
    expect(statusOf(f.client, "10011")).toBe("APPROVED");
  });

  it("[SWHR2-C-0133] reads the status", async () => {
    const f = await fulfilment();
    f.client.exec(
      "insert into op_order_workflow (order_id, status) values ('10011', 'SHIPPED_PART')",
    );
    expect(f.workflow.getOrderStatus("10011")).toBe("SHIPPED_PART");
  });

  it("[SWHR2-C-0134] an unknown order is not found", async () => {
    const f = await fulfilment();
    expect(() => f.workflow.getOrderStatus("99999")).toThrow(/not.?found/i);
    try {
      f.workflow.getOrderStatus("99999");
    } catch (e) {
      expect((e as { status?: number }).status).toBe(404);
    }
  });

  it("[SWHR2-C-0103] a placed order starts PENDING", async () => {
    const f = await fulfilment();
    f.workflow.startWorkflow(f.db, "10031", "PENDING");
    await f.receive.receiveOrder({
      orderId: "10032",
      locale: "en_US",
      totalPrice: 600,
      lines: [{ itemId: "EST-1", lineNumber: 1, quantity: 1, unitPrice: 600 }],
    });
    expect(statusOf(f.client, "10032")).toBe("PENDING");
    expect(f.workflow.getOrderStatus("10031")).toBe("PENDING");
  });

  it("[SWHR2-C-0145] one record carries APPROVED", async () => {
    const f = await fulfilment();
    await f.receive.createPurchaseOrder(f.db, purchaseOrder("10011", [["EST-1", 1]]));
    f.workflow.startWorkflow(f.db, "10011", "PENDING");
    f.decide.decideBatch(approvalXml("10011", "APPROVED"));
    expect(count(f.client, "op_order_workflow", "order_id = '10011'")).toBe(1);
    expect(f.workflow.getOrderStatus("10011")).toBe("APPROVED");
  });
});

describe("status tracking", () => {
  it("[SWHR2-C-0114] APPROVED decision sets a pending order APPROVED", async () => {
    const f = await fulfilment();
    await f.receive.createPurchaseOrder(f.db, purchaseOrder("10015", [["EST-1", 1]]));
    f.workflow.startWorkflow(f.db, "10015", "PENDING");
    f.decide.decideBatch(approvalXml("10015", "APPROVED"));
    expect(statusOf(f.client, "10015")).toBe("APPROVED");
  });

  it("[SWHR2-C-0115] a DENIED decision for an APPROVED order is ignored", async () => {
    const f = await fulfilment();
    await f.approvedOrder("10016", [["EST-1", 1]]);
    expect(f.workflow.setStatus(f.db, "10016", "DENIED")).toBe(false);
    f.decide.decideBatch(approvalXml("10016", "DENIED"));
    expect(statusOf(f.client, "10016")).toBe("APPROVED");
  });

  it("[SWHR2-C-0105] a denied order stays DENIED", async () => {
    const f = await fulfilment();
    await f.receive.createPurchaseOrder(f.db, purchaseOrder("10013", [["EST-1", 1]]));
    pending(f, "10013");
    f.decide.decideBatch(approvalXml("10013", "DENIED"));
    f.decide.decideBatch(approvalXml("10013", "APPROVED"));
    expect(f.workflow.setStatus(f.db, "10013", "COMPLETED")).toBe(false);
    f.invoices.handleInvoice(f.invoiceFor("10013", [["EST-1", 1]]));
    expect(statusOf(f.client, "10013")).toBe("DENIED");
    expect(messages(f.client, "supplier.purchase-order", "%10013%")).toEqual([]);
  });

  it("[SWHR2-C-0116] a partial shipment sets SHIPPED_PART", async () => {
    const f = await fulfilment();
    await f.approvedOrder("10017", [
      ["EST-1", 2],
      ["EST-2", 1],
    ]);
    f.invoices.handleInvoice(f.invoiceFor("10017", [["EST-1", 2]]));
    expect(statusOf(f.client, "10017")).toBe("SHIPPED_PART");
  });

  it("[SWHR2-C-0104] SHIPPED_PART then COMPLETED", async () => {
    const f = await fulfilment();
    await f.approvedOrder("10012", [
      ["EST-1", 2],
      ["EST-2", 1],
    ]);
    f.invoices.handleInvoice(f.invoiceFor("10012", [["EST-1", 2]]));
    expect(statusOf(f.client, "10012")).toBe("SHIPPED_PART");
    f.invoices.handleInvoice(f.invoiceFor("10012", [["EST-2", 1]]));
    expect(statusOf(f.client, "10012")).toBe("COMPLETED");
  });

  it("[SWHR2-C-0123] a pending order is not sent to the supplier", async () => {
    const f = await fulfilment();
    const po = purchaseOrder("10022", [["EST-1", 1]]);
    po.total = 60000;
    await f.receive.createPurchaseOrder(f.db, po);
    pending(f, "10022");
    f.decide.decideBatch(approvalXml("10022", "PENDING"));
    expect(statusOf(f.client, "10022")).toBe("PENDING");
    expect(messages(f.client, "supplier.purchase-order", "%10022%")).toEqual([]);
  });
});

describe("order lines", () => {
  it("[SWHR2-C-0106] lines keep details and start unshipped", async () => {
    const f = await fulfilment();
    await f.receive.createPurchaseOrder(f.db, purchaseOrder("10011", [["EST-1", 2]]));
    const row = f.client.query("select * from op_po_line_items").get() as Record<string, unknown>;
    expect([row.item_id, row.quantity, row.quantity_shipped]).toEqual(["EST-1", 2, 0]);
  });

  it("[SWHR2-C-0107] deleting a purchase order cascades", async () => {
    const f = await fulfilment();
    await f.receive.createPurchaseOrder(f.db, purchaseOrder("10011", [["EST-1", 1]]));
    f.client.exec("delete from op_purchase_orders where order_id = '10011'");
    for (const t of ["op_po_contacts", "op_po_cards", "op_po_line_items"])
      expect(count(f.client, t)).toBe(0);
  });
});
