// @vitest-environment node
import { describe, expect, it } from "vitest";

import { count, ORDER_TABLES, purchaseOrder } from "../orders/testHarness";
import { loadApp } from "../customers/testHarness";

async function app() {
  const base = await loadApp();
  return {
    ...base,
    svc: await import("./receive"),
    codec: await import("../documents/purchase-order"),
  };
}

describe("purchase order storage", () => {
  it("[SWHR2-C-0213] stores the header, one contact, one card and two lines with shipped quantity 0", async () => {
    const { db, client, svc } = await app();
    await svc.createPurchaseOrder(db, purchaseOrder("10011"));
    expect(count(client, "op_purchase_orders", "order_id = '10011'")).toBe(1);
    expect(count(client, "op_po_contacts", "order_id = '10011'")).toBe(1);
    expect(count(client, "op_po_cards", "order_id = '10011'")).toBe(1);
    const lines = client
      .query("select quantity_shipped q from op_po_line_items where order_id = '10011'")
      .all();
    expect(lines).toEqual([{ q: 0 }, { q: 0 }]);
  });

  it("[SWHR2-C-0214] a card record that cannot be created keeps nothing of the order", async () => {
    const { db, client, svc } = await app();
    const po = purchaseOrder("10011");
    po.card = { ...po.card, cardNumber: null as unknown as string };
    let failure: unknown;
    try {
      await svc.createPurchaseOrder(db, po);
    } catch (e) {
      failure = e;
    }
    expect((failure as Error | undefined)?.message).not.toMatch(/VortexNotImplemented/);
    expect(failure).toBeDefined();
    for (const t of ORDER_TABLES) expect(count(client, t), t).toBe(0);
  });

  it("[SWHR2-C-0226] looks an order up by its id", async () => {
    const { db, svc } = await app();
    await svc.createPurchaseOrder(db, purchaseOrder("10011"));
    expect(await svc.getPurchaseOrder("10011")).toEqual(purchaseOrder("10011"));
    expect(await svc.getPurchaseOrder("99999")).toBeUndefined();
  });

  it("[SWHR2-C-0227] a second order with an existing id is refused and the stored order is unchanged", async () => {
    const { db, client, svc } = await app();
    await svc.createPurchaseOrder(db, purchaseOrder("10011", [["EST-1", 2]]));
    await expect(
      svc.createPurchaseOrder(db, purchaseOrder("10011", [["EST-6", 1]])),
    ).rejects.toThrow(/UNIQUE|constraint|exists/i);
    expect(client.query("select item_id, quantity from op_po_line_items").all()).toEqual([
      { item_id: "EST-1", quantity: 2 },
    ]);
  });

  it("[SWHR2-C-0222] a document that is not a purchase order creates no order", async () => {
    const { client, codec } = await app();
    expect(() => codec.fromXml("<Invoice/>")).toThrow("PurchaseOrder element expected.");
    for (const t of ORDER_TABLES) expect(count(client, t), t).toBe(0);
  });

  it("[SWHR2-C-0220] receiving an order message stores the order, starts its workflow as PENDING and marks the message delivered", async () => {
    const { client, codec } = await app();
    const { processDue } = await import("../messaging/worker");
    const po = { ...purchaseOrder("10011"), total: 60000 };
    client.exec(
      `insert into messages (channel, payload, status, created_at) values ('order.new', '${codec.toXml(po).replace(/'/g, "''")}', 'pending', 0)`,
    );
    const { id } = client.query("select id from messages").get() as { id: number };
    expect(await processDue()).toBe(1);
    expect(
      client.query("select status from op_order_workflow where order_id = '10011'").get(),
    ).toEqual({ status: "PENDING" });
    expect(count(client, "op_purchase_orders")).toBe(1);
    expect(client.query("select status from messages where id = ?").get(id)).toEqual({
      status: "delivered",
    });
  });
});
