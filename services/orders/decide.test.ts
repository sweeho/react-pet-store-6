// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import {
  adminCookies,
  call,
  deliver,
  loadOrders,
  messagesOn,
  statusOf,
} from "../../tests/acceptance/order-approval/harness";

const commit = (
  app: Awaited<ReturnType<typeof loadOrders>>,
  cookies: Record<string, string>,
  ids: string[],
) =>
  call(app, "../../../routes/api/admin/orders/decisions.post", {
    method: "POST",
    url: "/api/admin/orders/decisions",
    cookies,
    json: { decisions: ids.map((orderId) => ({ orderId, status: "APPROVED" })) },
  });

describe("approval document", () => {
  it("[SWHR2-C-0234] reads an unlisted status as free text", async () => {
    await loadOrders();
    const { readApprovalBatch } = await import("./decide");
    const xml =
      "<OrderApproval><Order><OrderId>1001</OrderId><OrderStatus>COMPLETED</OrderStatus></Order></OrderApproval>";
    expect(readApprovalBatch(xml)).toEqual([{ orderId: "1001", status: "COMPLETED" }]);
  });
});

describe("decision channel", () => {
  it("[SWHR2-C-0250] one message holds both decisions and the commit returns 202", async () => {
    const app = await loadOrders();
    await deliver({ orderId: "1001", locale: "en_US", total: 600 });
    await deliver({ orderId: "1003", locale: "en_US", total: 700 });
    const cookies = await adminCookies(app);
    const r = await commit(app, cookies, ["1001", "1003"]);
    expect(r.status).toBe(202);
    const msgs = messagesOn(app.client, "order.approval");
    expect(msgs).toHaveLength(1);
    for (const n of ["1001", "1003", "APPROVED"]) expect(msgs[0].payload).toContain(n);
    expect(statusOf(app.client, "1001")).toBe("PENDING");
  });

  it("[SWHR2-C-0246] a waiting decision survives a restart and is then delivered", async () => {
    const app = await loadOrders();
    await deliver({ orderId: "1001", locale: "en_US", total: 600 });
    const cookies = await adminCookies(app);
    await commit(app, cookies, ["1001"]);
    expect(messagesOn(app.client, "order.approval")).toHaveLength(1);
    expect(messagesOn(app.client, "order.approval")[0].status).toBe("pending");
    const { db } = await import("../../db/client");
    vi.resetModules();
    vi.doMock("../../db/client", () => ({ db }));
    const worker = await import("../messaging/worker");
    app.client.exec("update messages set available_at = 0 where status = 'pending'");
    await worker.processDue();
    expect(statusOf(app.client, "1001")).toBe("APPROVED");
    expect(messagesOn(app.client, "order.approval")[0].status).toBe("delivered");
    vi.doUnmock("../../db/client");
  });
});
