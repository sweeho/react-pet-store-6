// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { count, loadApp, ORDER_TABLES, orderIdOf, purchaseOrder, shopper } from "./harness";

describe("order placement", () => {
  // case: SWHR2-C-0212@v1
  it("SWHR2-C-0212: an unexpected failure during placement is answered as a Server Error carrying message and trace", async () => {
    vi.resetModules();
    vi.doMock("../../../services/ids", () => ({
      nextId: () => {
        throw new Error("boom-test");
      },
    }));
    const app = await shopper();
    const r = await app.place();
    const text = typeof r.body === "string" ? r.body : JSON.stringify(r.body);
    expect(r.status).toBe(500);
    expect(text).toContain("AppFailure");
    expect(text).toContain("boom-test");
    expect(text).toMatch(/trace/i);
    vi.doUnmock("../../../services/ids");
  });

  // case: SWHR2-C-0217@v1
  it("SWHR2-C-0217: the first three orders get ids 10011, 10012 and 10013", async () => {
    const app = await shopper();
    const ids = [];
    for (let i = 0; i < 3; i++) ids.push(orderIdOf((await app.place()).body));
    expect(ids).toEqual(["10011", "10012", "10013"]);
  });

  // case: SWHR2-C-0219@v1
  it("SWHR2-C-0219: a second order gets a different id from the same 1001 counter", async () => {
    const app = await shopper();
    expect(orderIdOf((await app.place()).body)).toBe("10011");
    const before = app.client
      .query("select next_value v from id_sequences where prefix = '1001'")
      .get() as { v: number };
    const second = orderIdOf((await app.place()).body);
    const after = app.client
      .query("select next_value v from id_sequences where prefix = '1001'")
      .get() as { v: number };
    expect(second).toBe("10012");
    expect(after.v).toBe(before.v + 1);
  });

  // case: SWHR2-C-0220@v1
  it("SWHR2-C-0220: submitting the checkout form returns at once and leaves the order on the new-order channel", async () => {
    const app = await shopper(); // the message worker is not started, so the consumer is paused
    const r = await app.place();
    expect(r.status).toBe(200);
    const orderId = orderIdOf(r.body);
    const waiting = app.client
      .query("select payload, status from messages where channel = 'order.new'")
      .all() as { payload: string; status: string }[];
    expect(waiting).toHaveLength(1);
    expect(waiting[0].status).toBe("pending");
    expect(waiting[0].payload).toContain(orderId);
    expect(
      app.client.query("select status from op_order_workflow where order_id = ?").get(orderId),
    ).toBeFalsy();
  });
});

describe("purchase order storage", () => {
  // case: SWHR2-C-0213@v1
  it("SWHR2-C-0213: creating a purchase order stores header, contact, card and two lines with shipped quantity 0", async () => {
    const { db, client } = await loadApp();
    const { createPurchaseOrder } = await import("../../../services/orders/receive");
    await createPurchaseOrder(db, purchaseOrder("10011"));
    expect(count(client, "op_purchase_orders", "order_id = '10011'")).toBe(1);
    expect(count(client, "op_po_contacts", "order_id = '10011'")).toBe(1);
    expect(count(client, "op_po_cards", "order_id = '10011'")).toBe(1);
    const lines = client.query("select * from op_po_line_items where order_id = '10011'").all() as {
      quantity_shipped: number;
    }[];
    expect(lines).toHaveLength(2);
    expect(lines.map((l) => l.quantity_shipped)).toEqual([0, 0]);
    expect(JSON.stringify(client.query("select * from op_po_contacts").all())).toContain(
      "1 Main St",
    );
  });

  // case: SWHR2-C-0214@v1
  it("SWHR2-C-0214: if the credit-card record cannot be created nothing from the order is kept", async () => {
    const { db, client } = await loadApp();
    const { createPurchaseOrder } = await import("../../../services/orders/receive");
    const before = ORDER_TABLES.map((t) => count(client, t));
    const po = purchaseOrder("10011");
    // a null card number breaks the card table's not-null rule
    po.card = { ...po.card, cardNumber: null as unknown as string };
    await expect(Promise.resolve().then(() => createPurchaseOrder(db, po))).rejects.toBeDefined();
    expect(ORDER_TABLES.map((t) => count(client, t))).toEqual(before);
  });

  // case: SWHR2-C-0226@v1
  it("SWHR2-C-0226: looking up purchase order 10011 by id returns that order", async () => {
    const { db } = await loadApp();
    const { createPurchaseOrder, getPurchaseOrder } = await import(
      "../../../services/orders/receive"
    );
    await createPurchaseOrder(db, purchaseOrder("10011"));
    const got = await getPurchaseOrder("10011");
    const text = JSON.stringify(got);
    expect(text).toContain("10011");
    expect(text).toContain("EST-1");
    expect(text).toContain("EST-6");
    expect(text).toContain("1 Main St");
  });

  // case: SWHR2-C-0227@v1
  it("SWHR2-C-0227: creating another purchase order with id 10011 is refused and the stored order is unchanged", async () => {
    const { db, client } = await loadApp();
    const { createPurchaseOrder } = await import("../../../services/orders/receive");
    await createPurchaseOrder(db, purchaseOrder("10011", [["EST-1", 2]]));
    await expect(
      Promise.resolve().then(() => createPurchaseOrder(db, purchaseOrder("10011", [["EST-6", 1]]))),
    ).rejects.toBeDefined();
    const lines = client
      .query("select item_id, quantity from op_po_line_items where order_id = '10011'")
      .all();
    expect(lines).toEqual([{ item_id: "EST-1", quantity: 2 }]);
  });

  // case: SWHR2-C-0222@v1
  it("SWHR2-C-0222: a document with root Invoice is rejected with 'PurchaseOrder element expected.' and creates no order", async () => {
    const { client } = await loadApp();
    const { fromXml } = await import("../../../services/documents/purchase-order");
    const before = count(client, "op_purchase_orders");
    expect(() => fromXml("<Invoice><OrderId>1</OrderId></Invoice>")).toThrow(
      "PurchaseOrder element expected.",
    );
    expect(count(client, "op_purchase_orders")).toBe(before);
  });
});
