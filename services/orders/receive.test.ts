import { describe, expect, it } from "vitest";

import { count, loadApp, ORDER_TABLES, purchaseOrder } from "./harness.test";

const rows = (client: import("bun:sqlite").Database) =>
  ORDER_TABLES.map((t) => {
    try {
      return count(client, t);
    } catch {
      return 0; // a missing table holds no rows
    }
  });

async function app() {
  const a = await loadApp();
  return { ...a, ...(await import("./receive")), ...(await import("../documents/purchase-order")) };
}

describe("purchase order storage", () => {
  it("[SWHR2-C-0213] stores header, contact, card and two lines with shipped quantity 0", async () => {
    const { db, client, createPurchaseOrder } = await app();
    await createPurchaseOrder(db, purchaseOrder("10011"));
    expect(count(client, "op_purchase_orders", "order_id = '10011'")).toBe(1);
    expect(count(client, "op_po_contacts", "order_id = '10011'")).toBe(1);
    expect(count(client, "op_po_cards", "order_id = '10011'")).toBe(1);
    const lines = client.query("select * from op_po_line_items where order_id = '10011'").all() as {
      quantity_shipped: number;
    }[];
    expect(lines.map((l) => l.quantity_shipped)).toEqual([0, 0]);
    expect(JSON.stringify(client.query("select * from op_po_contacts").all())).toContain(
      "1 Main St",
    );
  });

  it("[SWHR2-C-0214] keeps nothing when the credit-card record cannot be created", async () => {
    const { db, client, createPurchaseOrder } = await app();
    const before = rows(client);
    const po = purchaseOrder("10011");
    po.card = { ...po.card, cardNumber: null as unknown as string };
    await expect(Promise.resolve().then(() => createPurchaseOrder(db, po))).rejects.toBeDefined();
    expect(rows(client)).toEqual(before);
  });

  it("[SWHR2-C-0226] returns the stored order by its id, equal to the one created", async () => {
    const { db, createPurchaseOrder, getPurchaseOrder } = await app();
    const po = purchaseOrder("10011");
    await createPurchaseOrder(db, po);
    expect(await getPurchaseOrder("10011")).toEqual(po);
  });

  it("[SWHR2-C-0227] refuses a second order with an existing id and leaves the first unchanged", async () => {
    const { db, client, createPurchaseOrder } = await app();
    await createPurchaseOrder(db, purchaseOrder("10011", [["EST-1", 2]]));
    await expect(
      Promise.resolve().then(() => createPurchaseOrder(db, purchaseOrder("10011", [["EST-6", 1]]))),
    ).rejects.toBeDefined();
    expect(
      client.query("select item_id, quantity from op_po_line_items where order_id = '10011'").all(),
    ).toEqual([{ item_id: "EST-1", quantity: 2 }]);
  });

  it("[SWHR2-C-0222] a document that is not a purchase order creates no order", async () => {
    const { db, client, createPurchaseOrder, fromXml } = await app();
    await expect(
      Promise.resolve().then(() =>
        createPurchaseOrder(db, fromXml("<Invoice><OrderId>1</OrderId></Invoice>")),
      ),
    ).rejects.toThrow("PurchaseOrder element expected.");
    expect(rows(client)).toEqual([0, 0, 0, 0]);
  });
});
