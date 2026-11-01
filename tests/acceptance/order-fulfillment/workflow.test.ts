// @vitest-environment node
import { describe, expect, it } from "vitest";

import { deliver } from "../order-approval/harness";
import { approvalXml, count, fulfilment, messages, purchaseOrder, statusOf } from "./harness";

describe("order workflow", () => {
  // case: SWHR2-C-0103@v1
  it("SWHR2-C-0103: a newly placed order enters the workflow in status PENDING", async () => {
    const { client } = await fulfilment();
    await deliver({ orderId: "10011", locale: "en_US", total: 600 });
    expect(statusOf(client, "10011")).toBe("PENDING");
  });

  // case: SWHR2-C-0104@v1
  it("SWHR2-C-0104: an approved order goes to SHIPPED_PART after a partial shipment and to COMPLETED after the rest", async () => {
    const f = await fulfilment();
    await f.approvedOrder("10012", [
      ["EST-1", 2],
      ["EST-2", 1],
    ]);
    await f.invoices.handleInvoice(f.invoiceFor("10012", [["EST-1", 2]]));
    expect(statusOf(f.client, "10012")).toBe("SHIPPED_PART");
    await f.invoices.handleInvoice(f.invoiceFor("10012", [["EST-2", 1]]));
    expect(statusOf(f.client, "10012")).toBe("COMPLETED");
  });

  // case: SWHR2-C-0105@v1
  it("SWHR2-C-0105: a denied order stays DENIED and accepts no further status change", async () => {
    const f = await fulfilment();
    const po = purchaseOrder("10013", [["EST-1", 1]]);
    await f.receive.createPurchaseOrder(f.db, po);
    f.client.exec("insert into op_order_workflow (order_id, status) values ('10013', 'PENDING')");
    await f.decide.decideBatch(approvalXml("10013", "DENIED"));
    expect(statusOf(f.client, "10013")).toBe("DENIED");
    await f.decide.decideBatch(approvalXml("10013", "APPROVED"));
    await Promise.resolve(f.invoices.handleInvoice(f.invoiceFor("10013", [["EST-1", 1]]))).catch(
      () => undefined,
    );
    expect(statusOf(f.client, "10013")).toBe("DENIED");
    expect(messages(f.client, "supplier.purchase-order", "%10013%")).toEqual([]);
  });

  // case: SWHR2-C-0106@v1
  it("SWHR2-C-0106: stored order lines keep their details and start with quantity shipped 0", async () => {
    const f = await fulfilment();
    const po = purchaseOrder("10011", [
      ["EST-1", 2],
      ["EST-6", 5],
    ]);
    po.lines[0] = { ...po.lines[0], categoryId: "FISH", productId: "FI-SW-01", unitPrice: 1650 };
    po.lines[1] = { ...po.lines[1], categoryId: "DOGS", productId: "K9-BD-01", unitPrice: 1850 };
    await f.receive.createPurchaseOrder(f.db, po);
    const rows = f.client
      .query("select * from op_po_line_items order by line_number")
      .all() as Record<string, unknown>[];
    expect(
      rows.map((r) => [
        r.category_id,
        r.product_id,
        r.item_id,
        r.line_number,
        r.quantity,
        r.unit_price,
        r.quantity_shipped,
      ]),
    ).toEqual([
      ["FISH", "FI-SW-01", "EST-1", 1, 2, 1650, 0],
      ["DOGS", "K9-BD-01", "EST-6", 2, 5, 1850, 0],
    ]);
  });

  // case: SWHR2-C-0107@v1
  it("SWHR2-C-0107: deleting a purchase order also deletes its contact, address, credit card and line items", async () => {
    const f = await fulfilment();
    await f.receive.createPurchaseOrder(
      f.db,
      purchaseOrder("10011", [
        ["EST-1", 1],
        ["EST-2", 1],
        ["EST-6", 1],
      ]),
    );
    expect(count(f.client, "op_po_line_items")).toBe(3);
    // the contact's address (street "1 Main St") is stored outside the order header
    const tables = (
      f.client
        .query(
          "select name from sqlite_master where type = 'table' and name like 'op\\_%' escape '\\'",
        )
        .all() as { name: string }[]
    ).map((t) => t.name);
    const holdingAddress = () =>
      tables.filter((t) =>
        JSON.stringify(f.client.query(`select * from ${t}`).all()).includes("1 Main St"),
      );
    expect(holdingAddress().filter((t) => t !== "op_purchase_orders")).not.toEqual([]);
    f.client.exec("delete from op_purchase_orders where order_id = '10011'");
    for (const t of ["op_po_contacts", "op_po_cards", "op_po_line_items"])
      expect(count(f.client, t)).toBe(0);
    // no table still holds the deleted order's address
    expect(holdingAddress()).toEqual([]);
  });

  // case: SWHR2-C-0114@v1
  it("SWHR2-C-0114: an APPROVED decision for a pending order sets its status to APPROVED", async () => {
    const f = await fulfilment();
    await f.receive.createPurchaseOrder(f.db, purchaseOrder("10015", [["EST-1", 1]]));
    f.client.exec("insert into op_order_workflow (order_id, status) values ('10015', 'PENDING')");
    await f.decide.decideBatch(approvalXml("10015", "APPROVED"));
    expect(statusOf(f.client, "10015")).toBe("APPROVED");
  });

  // case: SWHR2-C-0115@v1
  it("SWHR2-C-0115: a DENIED decision for an order that is already APPROVED is ignored", async () => {
    const f = await fulfilment();
    await f.approvedOrder("10016", [["EST-1", 1]]);
    await expect(
      Promise.resolve(f.decide.decideBatch(approvalXml("10016", "DENIED"))),
    ).resolves.not.toThrow();
    expect(statusOf(f.client, "10016")).toBe("APPROVED");
  });

  // case: SWHR2-C-0116@v1
  it("SWHR2-C-0116: recording a partial shipment sets an approved order to SHIPPED_PART", async () => {
    const f = await fulfilment();
    await f.approvedOrder("10017", [
      ["EST-1", 2],
      ["EST-2", 1],
    ]);
    await f.invoices.handleInvoice(f.invoiceFor("10017", [["EST-1", 2]]));
    expect(statusOf(f.client, "10017")).toBe("SHIPPED_PART");
  });

  // case: SWHR2-C-0123@v1
  it("SWHR2-C-0123: an order held for approval is not sent to the supplier", async () => {
    const f = await fulfilment();
    const { toXml } = await import("../../../services/documents/purchase-order");
    const po = purchaseOrder("10022", [["EST-1", 1]]);
    po.total = 60000;
    f.messaging.enqueue(f.db, "order.new", toXml(po));
    await f.drain();
    expect(statusOf(f.client, "10022")).toBe("PENDING");
    expect(messages(f.client, "supplier.purchase-order", "%10022%")).toEqual([]);
  });

  // case: SWHR2-C-0131@v1
  it("SWHR2-C-0131: starting a workflow for order 10011 stores a record with status PENDING", async () => {
    const f = await fulfilment();
    await f.workflow.startWorkflow(f.db, "10011", "PENDING");
    expect(
      f.client.query("select status from op_order_workflow where order_id = '10011'").all(),
    ).toEqual([{ status: "PENDING" }]);
  });

  // case: SWHR2-C-0132@v1
  it("SWHR2-C-0132: starting a workflow for 10011 a second time fails and leaves the record unchanged", async () => {
    const f = await fulfilment();
    f.client.exec("insert into op_order_workflow (order_id, status) values ('10011', 'APPROVED')");
    await expect(
      Promise.resolve().then(() => f.workflow.startWorkflow(f.db, "10011", "PENDING")),
    ).rejects.toBeDefined();
    expect(
      f.client.query("select status from op_order_workflow where order_id = '10011'").all(),
    ).toEqual([{ status: "APPROVED" }]);
  });

  // case: SWHR2-C-0133@v1
  it("SWHR2-C-0133: requesting the status of order 10011 returns SHIPPED_PART", async () => {
    const f = await fulfilment();
    f.client.exec(
      "insert into op_order_workflow (order_id, status) values ('10011', 'SHIPPED_PART')",
    );
    expect(await f.workflow.getOrderStatus("10011")).toBe("SHIPPED_PART");
  });

  // case: SWHR2-C-0134@v1
  it("SWHR2-C-0134: requesting the status of unknown order 99999 fails with not-found", async () => {
    const f = await fulfilment();
    const err = await Promise.resolve()
      .then(() => f.workflow.getOrderStatus("99999"))
      .then(
        () => null,
        (e: unknown) =>
          e as { name?: string; message?: string; status?: number; statusCode?: number },
      );
    expect(err).not.toBeNull();
    expect(`${err?.name} ${err?.message} ${err?.status ?? err?.statusCode}`).toMatch(
      /not.?found|404/i,
    );
  });

  // case: SWHR2-C-0145@v1
  it("SWHR2-C-0145: the workflow record for 10011 is a single record with status APPROVED", async () => {
    const f = await fulfilment();
    await f.receive.createPurchaseOrder(f.db, purchaseOrder("10011", [["EST-1", 1]]));
    f.client.exec("insert into op_order_workflow (order_id, status) values ('10011', 'PENDING')");
    await f.decide.decideBatch(approvalXml("10011", "APPROVED"));
    expect(
      f.client.query("select status from op_order_workflow where order_id = '10011'").all(),
    ).toEqual([{ status: "APPROVED" }]);
  });
});
