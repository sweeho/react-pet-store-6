// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { fulfilment, messages, mod, purchaseOrder, statusOf } from "./harness";

describe("message channels", () => {
  // case: SWHR2-C-0118@v1
  it("SWHR2-C-0118: order submission returns before order processing approves or fulfils the order", async () => {
    const { shopper } = await import("../checkout/harness");
    const app = await shopper(); // the message worker is not started
    const r = await app.place();
    expect(r.status).toBe(200);
    const waiting = app.client
      .query("select status from messages where channel = 'order.new'")
      .all();
    expect(waiting).toEqual([{ status: "pending" }]);
  });

  // case: SWHR2-C-0135@v1
  it("SWHR2-C-0135: after a fresh installation the new-order, purchase-order and invoice channels accept messages", async () => {
    const f = await fulfilment();
    for (const channel of ["order.new", "supplier.purchase-order", "supplier.invoice"]) {
      f.messaging.enqueue(f.db, channel, `<test channel="${channel}"/>`);
      expect(messages(f.client, channel, `%${channel}%`).length).toBeGreaterThan(0);
    }
  });

  // case: SWHR2-C-0136@v1
  it("SWHR2-C-0136: one published invoice reaches both invoice channel subscribers", async () => {
    const { mailApp, resetEnv } = await import("../customer-notifications/harness");
    try {
      const f = await mailApp({ NOTIFY_SHIPMENT_ENABLED: "true" });
      await f.pendingOrder("10023", [
        ["EST-1", 1],
        ["EST-6", 1],
      ]);
      f.client.exec("update op_order_workflow set status = 'APPROVED' where order_id = '10023'");
      f.messaging.enqueue(f.db, "supplier.invoice", f.invoiceFor("10023", [["EST-1", 1]]));
      await f.drain();
      // order processing received it once: the shipped quantity is added exactly once
      expect(
        f.client
          .query(
            "select quantity_shipped q from op_po_line_items where order_id = '10023' and item_id = 'EST-1'",
          )
          .get(),
      ).toEqual({ q: 1 });
      expect(statusOf(f.client, "10023")).toBe("SHIPPED_PART");
      // the shipment notifier received it once: exactly one e-mail about order 10023
      expect(
        f.outbox.filter((m) => m.to.includes("c@example.com") && m.subject.includes("10023")),
      ).toHaveLength(1);
      // each subscriber's copy was consumed, and nothing is left to redeliver
      const rows = messages(f.client, "supplier.invoice", "%10023%");
      expect(rows.map((r) => [r.subscriber, r.status]).sort()).toEqual([
        ["notify.shipment", "delivered"],
        ["order-processing.invoice", "delivered"],
      ]);
      expect(await f.worker.processDue()).toBeFalsy();
    } finally {
      resetEnv();
      vi.doUnmock("nodemailer");
    }
  });

  // case: SWHR2-C-0137@v1
  it("SWHR2-C-0137: a new-order message that was not yet consumed is still delivered after a restart", async () => {
    const f = await fulfilment();
    const { toXml } = await import("../../../services/documents/purchase-order");
    f.messaging.enqueue(f.db, "order.new", toXml(purchaseOrder("10024", [["EST-1", 1]])));
    expect(messages(f.client, "order.new", "%10024%")[0].status).toBe("pending");
    // restart: drop every loaded module (all in-process state) but keep the same database
    const { db } = await import("../../../db/client");
    vi.resetModules();
    vi.doMock("../../../db/client", () => ({ db }));
    expect(messages(f.client, "order.new", "%10024%")[0].status).toBe("pending");
    const worker = await mod("../../../services/messaging/worker");
    await worker.processDue();
    vi.doUnmock("../../../db/client");
    expect(messages(f.client, "order.new", "%10024%")[0].status).toBe("delivered");
    expect(
      f.client.query("select count(*) n from op_purchase_orders where order_id = '10024'").get(),
    ).toEqual({ n: 1 });
  });
});

describe("stage transitions", () => {
  // case: SWHR2-C-0129@v1
  it("SWHR2-C-0129: a transition set up to take batches receives all three outbound messages in one hand-off", async () => {
    await fulfilment();
    const t = await mod("../../../services/orders/transitions");
    const spy = vi.fn();
    t.ORDER_TRANSITIONS.testStep = "spyBatch";
    t.registerTransition("spyBatch", { batch: spy });
    await t.handOff("testStep", ["m1", "m2", "m3"]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toEqual(["m1", "m2", "m3"]);
  });

  // case: SWHR2-C-0130@v1
  it("SWHR2-C-0130: asking for a transition that does not exist raises a transition error with the reason", async () => {
    await fulfilment();
    const t = await mod("../../../services/orders/transitions");
    t.ORDER_TRANSITIONS.testStep = "NoSuchTransition";
    const err = await Promise.resolve()
      .then(() => t.handOff("testStep", ["m1"]))
      .then(
        () => null,
        (e: unknown) => e as { name: string; message: string; cause?: unknown },
      );
    expect(err?.name).toBe("TransitionError");
    expect(`${err?.message} ${String(err?.cause)}`).toMatch(/NoSuchTransition/);
  });
});
