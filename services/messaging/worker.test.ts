// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import {
  fulfilment,
  messages,
  purchaseOrder,
} from "../../tests/acceptance/order-fulfillment/harness";

describe("channels", () => {
  it("[SWHR2-C-0135] the fulfilment channels accept messages", async () => {
    const f = await fulfilment();
    for (const channel of ["order.new", "supplier.purchase-order", "supplier.invoice"]) {
      f.messaging.enqueue(f.db, channel, `<test channel="${channel}"/>`);
      expect(messages(f.client, channel, `%${channel}%`).length).toBeGreaterThan(0);
    }
  });

  it("fan-out writes one row per subscriber", async () => {
    const f = await fulfilment();
    f.messaging.SUBSCRIBERS["supplier.invoice"].push("test.subscriber");
    try {
      f.messaging.enqueue(f.db, "supplier.invoice", "<Invoice/>");
      expect(
        messages(f.client, "supplier.invoice")
          .map((m) => m.subscriber)
          .sort(),
      ).toEqual(["order-processing.invoice", "test.subscriber"]);
    } finally {
      f.messaging.SUBSCRIBERS["supplier.invoice"].pop();
    }
  });

  it("[SWHR2-C-0137] a queued order survives a restart", async () => {
    const f = await fulfilment();
    const { toXml } = await import("../documents/purchase-order");
    f.messaging.enqueue(f.db, "order.new", toXml(purchaseOrder("10024", [["EST-1", 1]])));
    const { db } = await import("../../db/client");
    vi.resetModules();
    vi.doMock("../../db/client", () => ({ db }));
    const worker = await import("./worker");
    await worker.processDue();
    vi.doUnmock("../../db/client");
    expect(messages(f.client, "order.new", "%10024%")[0].status).toBe("delivered");
  });

  it("[SWHR2-C-0118] placing an order leaves it pending for the worker", async () => {
    const { shopper } = await import("../../tests/acceptance/checkout/harness");
    const app = await shopper();
    expect((await app.place()).status).toBe(200);
    expect(
      app.client.query("select status from messages where channel = 'order.new'").all(),
    ).toEqual([{ status: "pending" }]);
  });

  it("[SWHR2-C-0263] the hand-off takes a message with no role check", async () => {
    const f = await fulfilment();
    expect(() => f.messaging.enqueue(f.db, "order.new", "{}")).not.toThrow();
  });

  it("[SWHR2-C-0264] no route under routes/api reaches the outbox", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    await fulfilment();
    const files = readdirSync("routes/schemas");
    expect(files.length).toBeGreaterThan(0);
    for (const file of files.filter((n) => !/\.test\./.test(n)))
      expect(readFileSync(`routes/schemas/${file}`, "utf8")).not.toMatch(/messaging|enqueue/);
  });
});
