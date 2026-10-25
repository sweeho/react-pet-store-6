// @vitest-environment node
import { readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { fulfilment } from "../order-fulfillment/harness";
import { call } from "../shopping-cart/harness";
import { loadApp } from "./harness";

describe("in-process hand-off", () => {
  // case: SWHR2-C-0263@v1
  it("SWHR2-C-0263: the hand-off service accepts a message from an order component without a role check and records the caller", async () => {
    // an in-process caller with no session, role or cookie hands a message to messaging.enqueue
    const f = await fulfilment();
    const payload = JSON.stringify({ orderId: "1001", userId: "j2ee" });
    expect(() => f.messaging.enqueue(f.db, "order.new", payload)).not.toThrow();
    const rows = f.client
      .query("select * from messages where channel = 'order.new'")
      .all() as Record<string, unknown>[];
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("pending");
    // the message that was accepted is the one carrying the caller
    expect(JSON.stringify(rows[0])).toContain("j2ee");
  });

  // case: SWHR2-C-0264@v1
  it("SWHR2-C-0264: no public route reaches the hand-off service", async () => {
    const app = await loadApp();
    const messaging = await import("../../../services/messaging");
    const enqueue = vi.spyOn(messaging, "enqueue");
    const before = (app.client.query("select count(*) n from messages").get() as { n: number }).n;
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (!/\.test\./.test(e.name)) files.push(path.relative("routes/api", p));
      }
    };
    walk(path.join(process.cwd(), "routes/api"));
    // Call every public route as an anonymous outsider, whatever its name, carrying a marker in
    // every field, then look for the marker in anything the hand-off service stored.
    const MARK = "outside-probe-7f3a";
    const methods = ["get", "post", "put", "patch", "delete"];
    for (const f of files) {
      const parts = f.replace(/\.ts$/, "").split(path.sep);
      const last = parts[parts.length - 1].split(".");
      const method = methods.includes(last[last.length - 1]) ? last.pop()! : "get";
      parts[parts.length - 1] = last.join(".");
      const params: Record<string, string> = {};
      const url = parts
        .map((seg) =>
          seg.replace(/\[(?:\.\.\.)?([^\]]+)\]/g, (_m, name: string) => {
            params[name] = MARK;
            return MARK;
          }),
        )
        .join("/");
      await call(app, `../../../routes/api/${f.replace(/\.ts$/, "")}`, {
        method: method.toUpperCase(),
        url: `/api/${url}?q=${MARK}`,
        params,
        json:
          method === "get" ? undefined : { orderId: MARK, body: MARK, message: MARK, userId: MARK },
      });
    }
    // the hand-off may be reached by nothing in the application's public surface: neither the
    // enqueue function nor the stored messages change, whatever the routes are called or read
    expect(enqueue).not.toHaveBeenCalled();
    expect(app.client.query("select count(*) n from messages").get()).toEqual({ n: before });
  });
});

describe("order line data layer", () => {
  // case: SWHR2-C-0268@v1
  it("SWHR2-C-0268: an order process creates, reads and updates order lines without a role error", async () => {
    // order processes act with no session or role: receipt creates the lines, the invoice step updates them
    const f = await fulfilment();
    await f.approvedOrder("10011", [["EST-1", 2]]);
    const line = () =>
      f.client
        .query(
          "select item_id, quantity, quantity_shipped from op_po_line_items where order_id = '10011'",
        )
        .all();
    expect(line()).toEqual([{ item_id: "EST-1", quantity: 2, quantity_shipped: 0 }]);
    await f.invoices.handleInvoice(f.invoiceFor("10011", [["EST-1", 2]]));
    expect(line()).toEqual([{ item_id: "EST-1", quantity: 2, quantity_shipped: 2 }]);
  });
});
