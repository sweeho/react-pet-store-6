// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { adminCookies, call, deliver, loadOrders, messagesOn, statusOf } from "./harness";

const PO_CHANNELS = /purchase|supplier|po/i;

describe("automatic approval", () => {
  const cases: [string, string, string, number, string][] = [
    // case: SWHR2-C-0228@v1
    [
      "SWHR2-C-0228: a US order totalling 499.99 is approved automatically",
      "1001",
      "en_US",
      499.99,
      "APPROVED",
    ],
    // case: SWHR2-C-0229@v1
    [
      "SWHR2-C-0229: a US order totalling exactly 500.00 stays PENDING",
      "1002",
      "en_US",
      500.0,
      "PENDING",
    ],
    // case: SWHR2-C-0230@v1
    ["SWHR2-C-0230: a US order totalling 612.50 stays PENDING", "1003", "en_US", 612.5, "PENDING"],
    // case: SWHR2-C-0231@v1
    [
      "SWHR2-C-0231: a ja_JP order totalling 49999 is approved automatically",
      "1004",
      "ja_JP",
      49999,
      "APPROVED",
    ],
    // case: SWHR2-C-0232@v1
    [
      "SWHR2-C-0232: a ja_JP order totalling exactly 50000 stays PENDING",
      "1005",
      "ja_JP",
      50000,
      "PENDING",
    ],
    // case: SWHR2-C-0233@v1
    [
      "SWHR2-C-0233: a zh_CN order totalling 10 is never approved automatically",
      "1006",
      "zh_CN",
      10,
      "PENDING",
    ],
  ];
  for (const [title, orderId, locale, total, expected] of cases) {
    it(title, async () => {
      const { client } = await loadOrders();
      await deliver({ orderId, locale, total });
      expect(statusOf(client, orderId)).toBe(expected);
    });
  }

  // case: SWHR2-C-0229@v1 (second expectation: no purchase order sent)
  it("SWHR2-C-0229: no purchase order is sent for the order left PENDING", async () => {
    const { client } = await loadOrders();
    await deliver({ orderId: "1002", locale: "en_US", total: 500 });
    const rows = client.query("select channel, payload from messages").all() as {
      channel: string;
      payload: string;
    }[];
    expect(rows.filter((r) => PO_CHANNELS.test(r.channel) && r.payload.includes("1002"))).toEqual(
      [],
    );
  });

  // case: SWHR2-C-0230@v1 (second expectation: listed as pending)
  it("SWHR2-C-0230: order 1003 appears in the pending orders list", async () => {
    const app = await loadOrders();
    await deliver({ orderId: "1003", locale: "en_US", total: 612.5 });
    const cookies = await adminCookies(app);
    const r = await call(app, "../../../routes/api/admin/orders/index.get", {
      url: "/api/admin/orders?status=PENDING",
      cookies,
    });
    expect(JSON.stringify(r.body)).toContain("1003");
  });

  // case: SWHR2-C-0239@v1
  it("SWHR2-C-0239: a new order is stored with status PENDING before the approval decision is made", async () => {
    vi.resetModules();
    const seen: (string | undefined)[] = [];
    const { db } = await import("../../../db/client");
    const client = db.$client as unknown as import("bun:sqlite").Database;
    vi.doMock("../../../services/orders/approval", async (orig) => {
      const real = await orig<typeof import("../../../services/orders/approval")>();
      return {
        ...real,
        autoApproves: (...args: Parameters<typeof real.autoApproves>) => {
          seen.push(statusOf(client, "1007"));
          return real.autoApproves(...args);
        },
      };
    });
    await deliver({ orderId: "1007", locale: "en_US", total: 100 });
    expect(seen).toEqual(["PENDING"]);
    expect(statusOf(client, "1007")).toBe("APPROVED");
    vi.doUnmock("../../../services/orders/approval");
  });
});

describe("decision channel", () => {
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

  // case: SWHR2-C-0246@v1
  it("SWHR2-C-0246: an approval decision stays on the channel until order processing receives it", async () => {
    const app = await loadOrders();
    await deliver({ orderId: "1001", locale: "en_US", total: 600 });
    const cookies = await adminCookies(app);
    await commit(app, cookies, ["1001"]);
    // The consumer is not running, so the row must still be waiting.
    const waiting = messagesOn(app.client, "order.approval");
    expect(waiting).toHaveLength(1);
    expect(waiting[0].status).toBe("pending");
    expect(statusOf(app.client, "1001")).toBe("PENDING");
    // restart: drop every loaded module (all in-process state) but keep the same database
    const { db } = await import("../../../db/client");
    vi.resetModules();
    vi.doMock("../../../db/client", () => ({ db }));
    const stillWaiting = messagesOn(app.client, "order.approval");
    expect(stillWaiting).toHaveLength(1);
    expect(stillWaiting[0].payload).toBe(waiting[0].payload);
    // the restarted consumer receives the stored payload
    const { decideBatch } = await import("../../../services/orders/decide");
    await decideBatch(stillWaiting[0].payload);
    expect(statusOf(app.client, "1001")).toBe("APPROVED");
    vi.doUnmock("../../../db/client");
  });

  // case: SWHR2-C-0250@v1
  it("SWHR2-C-0250: committing approvals for 1001 and 1003 places one message holding both and returns without waiting", async () => {
    const app = await loadOrders();
    await deliver({ orderId: "1001", locale: "en_US", total: 600 });
    await deliver({ orderId: "1003", locale: "en_US", total: 700 });
    const cookies = await adminCookies(app);
    const r = await commit(app, cookies, ["1001", "1003"]);
    expect(r.status).toBe(202);
    const msgs = messagesOn(app.client, "order.approval");
    expect(msgs).toHaveLength(1);
    for (const needle of ["1001", "1003", "APPROVED"]) expect(msgs[0].payload).toContain(needle);
    expect(statusOf(app.client, "1001")).toBe("PENDING");
  });
});

describe("approval document", () => {
  // case: SWHR2-C-0234@v1
  it("SWHR2-C-0234: a batch entry with the unlisted status COMPLETED is read without a format error", async () => {
    await loadOrders();
    const { readApprovalBatch } = await import("../../../services/orders/decide");
    const xml =
      "<OrderApproval><Order><OrderId>1001</OrderId><OrderStatus>COMPLETED</OrderStatus></Order></OrderApproval>";
    const entries = readApprovalBatch(xml) as { orderId: string; status: string }[];
    expect(entries).toEqual([expect.objectContaining({ orderId: "1001", status: "COMPLETED" })]);
  });
});
