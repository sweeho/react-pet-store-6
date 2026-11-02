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

  it("[SWHR2-C-0012] lists orders by status as a bare array with M/D/YYYY dates", async () => {
    const app = await loadOrders();
    await deliver({ orderId: "1001", locale: "en_US", total: 600 });
    await deliver({ orderId: "1002", locale: "en_US", total: 100 });
    const cookies = await adminCookies(app);
    const get = (status: string) =>
      call(app, "../../routes/api/admin/orders/index.get", {
        url: `/api/admin/orders?status=${status}`,
        cookies,
      });
    const pending = (await get("PENDING")).body as { date: string }[];
    expect(pending).toHaveLength(2);
    expect(pending[0]).toEqual(
      expect.objectContaining({ id: "1001", orderId: "1001", amount: 600, totalPrice: 600 }),
    );
    expect(pending[0].date).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
    expect((await get("APPROVED")).body).toEqual([]);
  });

  it("[SWHR2-C-0015] matches the status exactly; unknown text is an empty list, a missing one a 400", async () => {
    const app = await loadOrders();
    await deliver({ orderId: "1001", locale: "en_US", total: 600 });
    const cookies = await adminCookies(app);
    const get = (url: string) =>
      call(app, "../../routes/api/admin/orders/index.get", { url, cookies });
    const r = await get("/api/admin/orders?status=pending");
    expect(r.status).toBe(200);
    expect(r.body).toEqual([]);
    expect((await get("/api/admin/orders")).status).toBe(400);
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
    for (const kind of ["revenue", "order-counts"]) {
      const r = await call(app, `../../routes/api/admin/sales/${kind}.get`, {
        url: `/api/admin/sales/${kind}${url}`,
        cookies,
      });
      expect(Array.isArray(r.body)).toBe(true);
      expect((r.body as { value: number }[])[0].value).toBe(kind === "revenue" ? 600 : 1);
    }
  });
});
