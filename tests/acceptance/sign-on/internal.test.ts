// @vitest-environment node
import { readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { loadApp } from "./harness";

describe("in-process hand-off", () => {
  // case: SWHR2-C-0263@v1
  it("SWHR2-C-0263: the hand-off service accepts a message from an order component without a role check and records the caller", async () => {
    const { client } = await loadApp();
    // order-fulfillment owns the enqueue function; assumed at services/fulfillment/queue.ts
    const queue = await import("../../../services/fulfillment/queue");
    await expect(
      Promise.resolve(
        queue.enqueueMessage({ orderId: "1001", body: "order placed" }, { userId: "j2ee" }),
      ),
    ).resolves.not.toThrow();
    const tables = client
      .query("select name from sqlite_master where type = 'table' and name not like 'sqlite_%'")
      .all() as { name: string }[];
    const dump = tables
      .map((t) => JSON.stringify(client.query(`select * from "${t.name}"`).all()))
      .join("\n");
    expect(dump).toContain("j2ee");
    expect(dump).toContain("order placed");
  });

  // case: SWHR2-C-0264@v1
  it("SWHR2-C-0264: no public route reaches the hand-off service", () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (!/\.test\./.test(e.name)) files.push(path.relative("routes/api", p));
      }
    };
    walk(path.join(process.cwd(), "routes/api"));
    const offenders = files.filter((f) => /enqueue|hand-?off|message|queue|order-?line/i.test(f));
    expect(offenders).toEqual([]);
  });
});

describe("order line data layer", () => {
  // case: SWHR2-C-0268@v1
  it("SWHR2-C-0268: an order process creates, reads and updates order lines without a role error", async () => {
    await loadApp();
    // assumed module: services/order/lines.ts (checkout / order-fulfillment)
    const lines = await import("../../../services/order/lines");
    const caller = { userId: "j2ee" };
    const created = await lines.createOrderLine(
      { orderId: "1001", lineNumber: 1, itemId: "EST-1", quantity: 2, unitPrice: 1000 },
      caller,
    );
    expect(created).toBeDefined();
    const read = await lines.getOrderLines("1001", caller);
    expect(JSON.stringify(read)).toContain("EST-1");
    await expect(lines.updateQuantityShipped("1001", 1, 2, caller)).resolves.not.toThrow();
  });
});
