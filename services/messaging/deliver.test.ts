import { describe, expect, it } from "vitest";

import { count, loadApp, purchaseOrder } from "../orders/harness.test";

async function app() {
  const a = await loadApp();
  return {
    ...a,
    ...(await import("./enqueue")),
    ...(await import("./deliver")),
    ...(await import("../orders/receive")),
    ...(await import("../documents/purchase-order")),
  };
}

describe("order.new delivery", () => {
  it("stores a queued order document once and marks the message delivered", async () => {
    const a = await app();
    a.enqueue(a.db, a.ORDER_NEW, a.toXml(purchaseOrder("10011")));
    const handlers = { [a.ORDER_NEW]: a.receiveOrderDocument };
    expect(a.deliverPending(handlers)).toBe(1);
    expect(a.deliverPending(handlers)).toBe(0);
    expect(count(a.client, "op_purchase_orders", "order_id = '10011'")).toBe(1);
    expect(count(a.client, "messages", "status = 'delivered'")).toBe(1);
  });

  it("keeps a document that cannot be stored pending, then failed after five tries", async () => {
    const a = await app();
    a.enqueue(a.db, a.ORDER_NEW, "<Invoice/>");
    const handlers = { [a.ORDER_NEW]: a.receiveOrderDocument };
    for (let i = 0; i < 4; i++) a.deliverPending(handlers);
    expect(count(a.client, "messages", "status = 'pending'")).toBe(1);
    a.deliverPending(handlers);
    expect(count(a.client, "messages", "status = 'failed'")).toBe(1);
    expect(count(a.client, "op_purchase_orders")).toBe(0);
  });
});
