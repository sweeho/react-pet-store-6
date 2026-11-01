// @vitest-environment node
import { readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { SHIPPING, cookieValue, orderIdOf, shopper } from "../checkout/harness";
import { fulfilment } from "../order-fulfillment/harness";
import { call } from "../shopping-cart/harness";
import { ADMIN, SUPPLIER } from "./harness";

describe("in-process hand-off", () => {
  // case: SWHR2-C-0263@v1
  it("SWHR2-C-0263: the hand-off service accepts a message from an order component without a role check and records the caller", async () => {
    // the checkout component, acting for signed-in j2ee, hands the new order to messaging.enqueue
    // itself; the test supplies no identity, so j2ee in the stored message came from the caller
    const app = await shopper();
    const placed = await app.place();
    expect(placed.status).toBe(200);
    const rows = app.client
      .query("select * from messages where channel = 'order.new'")
      .all() as Record<string, unknown>[];
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("pending");
    const { fromXml } = await import("../../../services/documents/purchase-order");
    const stored = fromXml(rows[0].payload as string);
    expect(stored.userId).toBe("j2ee");
    expect(stored.orderId).toBe(orderIdOf(placed.body));
    // and the hand-off itself takes a message from a caller with no session or role at all
    const f = await fulfilment();
    const payload = JSON.stringify({ orderId: "1001" });
    expect(() => f.messaging.enqueue(f.db, "order.new", payload)).not.toThrow();
    expect(
      f.client.query("select status, payload from messages where payload = ?").all(payload),
    ).toEqual([{ status: "pending", payload }]);
  });

  // case: SWHR2-C-0264@v1
  it("SWHR2-C-0264: no public route reaches the hand-off service", async () => {
    // a working storefront (catalog, customer j2ee) whose own checkout is known to hand off a message
    const app = await shopper();
    const messages = () =>
      app.client.query("select id, channel, payload from messages").all() as {
        id: unknown;
        channel: string;
        payload: string;
      }[];
    const start = messages().length;
    expect((await app.place()).status).toBe(200);
    expect(messages().length).toBeGreaterThan(start);
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (!/\.test\./.test(e.name)) files.push(path.relative("routes/api", p));
      }
    };
    walk(path.join(process.cwd(), "routes/api"));
    // Every caller the public surface has: anonymous, a signed-in shopper, an administrator and a
    // supplier. Each signs in afresh before every route, so a sign-out route cannot leave the
    // rest of the probe anonymous, and routes behind a sign-in check are passed, not stopped.
    const signIn = async (route: string, cookie: string, json: unknown) => {
      const r = await call(app, `../../../routes/api/${route}`, {
        method: "POST",
        url: `/api/${route.replace(/\.post$/, "")}`,
        json,
      });
      return { [cookie]: cookieValue(r.setCookies, cookie) ?? "" };
    };
    const callers: Record<string, () => Promise<Record<string, string> | undefined>> = {
      anonymous: async () => undefined,
      shopper: () =>
        signIn("session/sign-in.post", "ps_sid", {
          userId: "j2ee",
          password: "j2ee",
          remember: false,
        }),
      administrator: () => signIn("admin/sign-in.post", "admin_sid", ADMIN),
      supplier: () => signIn("supplier/sign-in.post", "supplier_sid", SUPPLIER),
    };
    // the signed-in callers really are signed in (a probe that never passed sign-in proves nothing)
    for (const who of ["shopper", "administrator", "supplier"]) {
      expect(Object.values((await callers[who]())!)[0]).not.toBe("");
    }
    // Call every public route, whatever its name, with order-shaped input (so a route is not
    // stopped by a malformed body) and a marker in every id and message field.
    const MARK = "outside-probe-7f3a";
    const methods = ["get", "post", "put", "patch", "delete"];
    const before = new Set(messages().map((m) => String(m.id)));
    for (const who of Object.keys(callers)) {
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
        const cookies = await callers[who]();
        if (who === "shopper")
          // a cart to check out, so order placement goes as far as its own hand-off
          await call(app, "../../../routes/api/cart/items.post", {
            method: "POST",
            url: "/api/cart/items",
            cookies,
            json: { itemId: "EST-1" },
          });
        await call(app, `../../../routes/api/${f.replace(/\.ts$/, "")}`, {
          method: method.toUpperCase(),
          url: `/api/${url}?q=${MARK}`,
          params,
          cookies,
          json:
            method === "get"
              ? undefined
              : {
                  orderId: MARK,
                  body: MARK,
                  message: MARK,
                  userId: MARK,
                  itemId: "EST-1",
                  channel: MARK,
                  payload: MARK,
                  billing: SHIPPING,
                  shipping: SHIPPING,
                },
        });
      }
    }
    const added = messages().filter((m) => !before.has(String(m.id)));
    // no caller, signed in or not, got the hand-off to store a message of its own making
    expect(added.filter((m) => `${m.channel} ${m.payload}`.includes(MARK))).toEqual([]);
    // the only messages the probe produced are the checkout component's own in-process hand-off of
    // an order it stored for the signed-in shopper, not a message the caller handed over
    const { fromXml } = await import("../../../services/documents/purchase-order");
    const stored = (id: string) =>
      app.client.query("select order_id from op_purchase_orders where order_id = ?").get(id);
    for (const m of added) {
      expect(m.channel).toBe("order.new");
      const order = fromXml(m.payload);
      expect(order.userId).toBe("j2ee");
      expect(stored(order.orderId)).toBeTruthy();
    }
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
