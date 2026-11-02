// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  adminCookies,
  call,
  deliver,
  loadOrders,
  messagesOn,
} from "../../../../services/orders/approvalHarness";

describe("admin order routes", () => {
  it("refuses a caller who is not signed in as administrator", async () => {
    const app = await loadOrders();
    const r = await call(app, "../../routes/api/admin/orders/index.get", {
      url: "/api/admin/orders?status=PENDING",
    });
    expect(r.status).toBe(401);
  });

  it("lists orders by status with both field name sets", async () => {
    const app = await loadOrders();
    await deliver({ orderId: "1001", locale: "en_US", total: 600 });
    await deliver({ orderId: "1002", locale: "en_US", total: 100 });
    const cookies = await adminCookies(app);
    const get = (status: string) =>
      call(app, "../../routes/api/admin/orders/index.get", {
        url: `/api/admin/orders?status=${status}`,
        cookies,
      });
    const pending = (await get("PENDING")).body as { items: unknown[]; orders: unknown[] };
    expect(pending.orders).toEqual([
      expect.objectContaining({ id: "1001", orderId: "1001", amount: 600, totalPrice: 600 }),
    ]);
    expect(pending.items).toEqual(pending.orders);
    expect(((await get("APPROVED")).body as { orders: unknown[] }).orders).toHaveLength(1);
    expect((await get("BOGUS")).status).toBe(400);
  });

  it("rejects an empty decision list and enqueues nothing", async () => {
    const app = await loadOrders();
    const cookies = await adminCookies(app);
    const r = await call(app, "../../routes/api/admin/orders/decisions.post", {
      method: "POST",
      url: "/api/admin/orders/decisions",
      cookies,
      json: { decisions: [] },
    });
    expect(r.status).toBe(400);
    expect(messagesOn(app.client, "order.approval")).toHaveLength(0);
  });

  it("sums revenue and counts orders per category", async () => {
    const app = await loadOrders();
    await deliver({ orderId: "1001", locale: "en_US", total: 600 });
    const cookies = await adminCookies(app);
    const url = "?start=2000-01-01&end=2100-01-01";
    for (const kind of ["revenue", "order-count"]) {
      const r = await call(app, `../../routes/api/admin/sales/${kind}.get`, {
        url: `/api/admin/sales/${kind}${url}`,
        cookies,
      });
      expect(Array.isArray(r.body)).toBe(true);
      expect((r.body as { value: number }[])[0].value).toBe(kind === "revenue" ? 600 : 1);
    }
  });
});
