// @vitest-environment node
import { describe, expect, it } from "vitest";

import { shopper } from "../checkout/harness";
import { fulfilment } from "../order-fulfillment/harness";

describe("in-process hand-off", () => {
  // case: SWHR2-C-0263@v1
  it("SWHR2-C-0263: the hand-off service accepts a message from an order component without a role check and records the caller", async () => {
    const app = await shopper();
    // A spy queue: every message handed to the service is copied, as queued, into spy_queue.
    app.client.exec("create table spy_queue as select * from messages where 0");
    app.client.exec(
      "create trigger spy_queue_copy after insert on messages begin insert into spy_queue select * from messages where rowid = new.rowid; end",
    );
    // Step 1: the order component (order placement), acting for signed-in j2ee, who holds no
    // special role, hands the new order to the service.
    const placed = await app.place();
    expect(placed.status).toBe(200);
    // Step 2: read what the spy queue received.
    const queued = app.client
      .query("select * from spy_queue where channel = 'order.new'")
      .all() as Record<string, unknown>[];
    // accepted with no role error: the message is on the queue
    expect(queued).toHaveLength(1);
    expect(queued[0].status).toBe("pending");
    // The queued message records the caller's identity, j2ee, as the hand-off's own record of
    // the message, not inside the document handed over.
    const recorded = Object.entries(queued[0])
      .filter(([column]) => column !== "payload")
      .filter(([, value]) => typeof value === "string" && /\bj2ee\b/.test(value))
      .map(([column]) => column);
    expect(recorded, "a column of the queued message, besides its payload, holds j2ee").not.toEqual(
      [],
    );
  });
});

describe("order line data layer", () => {
  // case: SWHR2-C-0268@v1
  it("SWHR2-C-0268: an order process creates, reads and updates order lines without a role error", async () => {
    // order processes act with no session or role: receipt creates the lines, the receipt
    // module's own lookup reads them back, and the invoice step updates them
    const f = await fulfilment();
    await f.approvedOrder("10011", [["EST-1", 2]]);
    const line = () =>
      f.client
        .query(
          "select item_id, quantity, quantity_shipped from op_po_line_items where order_id = '10011'",
        )
        .all();
    expect(line()).toEqual([{ item_id: "EST-1", quantity: 2, quantity_shipped: 0 }]);
    // the read goes through the order line data layer, called with no session or role
    const read = JSON.stringify(await f.receive.getPurchaseOrder("10011"));
    expect(read).toContain("10011");
    expect(read).toContain("EST-1");
    await f.invoices.handleInvoice(f.invoiceFor("10011", [["EST-1", 2]]));
    expect(line()).toEqual([{ item_id: "EST-1", quantity: 2, quantity_shipped: 2 }]);
  });
});
