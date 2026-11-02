// @vitest-environment node
import { vi } from "vitest";
import { afterEach, describe, expect, it } from "vitest";

import {
  approvalXml,
  fulfilment,
  messages,
  purchaseOrder,
  statusOf,
} from "../orders/fulfilmentHarness";

const KEYS = [
  "NOTIFY_APPROVAL_ENABLED",
  "NOTIFY_SHIPMENT_ENABLED",
  "NOTIFY_COMPLETED_ENABLED",
  "MAIL_HOST",
  "MAIL_USER",
  "MAIL_PASSWORD",
  "MAIL_FROM",
];
afterEach(() => KEYS.forEach((k) => delete process.env[k]));

interface Sent {
  from: string;
  to: string[];
  subject: string;
  html: string;
}
const ON = "true";
const TWO: [string, number][] = [
  ["EST-1", 2],
  ["EST-6", 1],
];

/** Starts the app with deployment settings and nodemailer replaced by a capturing transport. */
async function mailApp(
  env: Record<string, string> = {},
  opts: { failConnect?: boolean; gated?: boolean } = {},
) {
  KEYS.forEach((k) => delete process.env[k]);
  Object.assign(process.env, env);
  const outbox: Sent[] = [];
  const created: { host?: string; auth?: { user?: string } }[] = [];
  let attempts = 0;
  let open = !opts.gated;
  let release: () => void = () => undefined;
  const opened = new Promise<void>((res) => {
    release = () => {
      open = true;
      res();
    };
  });
  const createTransport = (options: { host?: string; auth?: { user?: string } }) => {
    created.push(options);
    return {
      sendMail: async (m: { from: string; to: string[]; subject: string; html: string }) => {
        attempts++;
        if (opts.failConnect) throw new Error("connect ECONNREFUSED");
        if (!open) await opened;
        outbox.push({ from: m.from, to: m.to, subject: m.subject, html: m.html });
        return { messageId: "test" };
      },
    };
  };
  vi.doMock("nodemailer", () => ({ default: { createTransport }, createTransport }));
  const f = await fulfilment();
  const send = (await import(/* @vite-ignore */ "./send")) as typeof import("./send");
  const pendingOrder = async (orderId: string, lines: [string, number][], locale = "en_US") => {
    const po = purchaseOrder(orderId, lines);
    po.email = "c@example.com";
    po.locale = locale;
    po.lines.forEach((l, i) => {
      l.productId = i === 0 ? "Angelfish" : "Bulldog";
      l.categoryId = i === 0 ? "FISH" : "DOGS";
      l.unitPrice = i === 0 ? 1650 : 1850;
    });
    await f.receive.createPurchaseOrder(f.db, po);
    f.client.exec(
      `insert into op_order_workflow (order_id, status) values ('${orderId}', 'PENDING')`,
    );
  };
  const approved = (id: string) =>
    f.client.exec(`update op_order_workflow set status = 'APPROVED' where order_id = '${id}'`);
  const approve = async (id: string) => {
    f.messaging.enqueue(f.db, "order.approval", approvalXml(id, "APPROVED"));
    await f.drain();
  };
  const fulfilLines = async (id: string, lines: [string, number][]) => {
    f.messaging.enqueue(f.db, "supplier.invoice", f.invoiceFor(id, lines));
    await f.drain();
  };
  return {
    ...f,
    send,
    outbox,
    created,
    release,
    attempts: () => attempts,
    pendingOrder,
    approved,
    approve,
    fulfilLines,
  };
}
const subjects = (o: Sent[]) => o.map((m) => m.subject);

describe("sender", () => {
  it("[SWHR2-C-0050] [SWHR2-C-0051] sends to every recipient as To only", async () => {
    const a = await mailApp();
    await a.send.sendMail({ to: "a@example.com, b@example.com", subject: "S", content: "C" });
    expect(a.outbox[0].to).toEqual(["a@example.com", "b@example.com"]);
  });

  it("[SWHR2-C-0052] sends from the shipped sender", async () => {
    const a = await mailApp();
    await a.send.sendMail({ to: "a@example.com", subject: "S", content: "C" });
    expect(a.outbox[0].from).toBe("customerservice@javapetstoredemo.com");
  });

  it("[SWHR2-C-0053] [SWHR2-C-0059] uses the operator's server, account and sender", async () => {
    const a = await mailApp({
      MAIL_HOST: "smtp.example.com",
      MAIL_USER: "petstore-mailer",
      MAIL_PASSWORD: "pw",
      MAIL_FROM: "orders@example.com",
    });
    await a.send.sendMail({ to: "a@example.com", subject: "S", content: "C" });
    expect(a.created.at(-1)?.host).toBe("smtp.example.com");
    expect(a.created.at(-1)?.auth?.user).toBe("petstore-mailer");
    expect(a.outbox[0].from).toBe("orders@example.com");
  });

  it("[SWHR2-C-0063] accepts a complete request", async () => {
    const a = await mailApp();
    await a.send.sendMail({ to: "a@example.com", subject: "Hello", content: "Body" });
    expect(a.outbox).toHaveLength(1);
  });

  it("[SWHR2-C-0064] rejects a request without a subject and sends nothing", async () => {
    const a = await mailApp();
    await expect(a.send.sendMail({ to: "a@example.com", content: "Body" })).rejects.toThrow(
      /subject/i,
    );
    expect(a.outbox).toEqual([]);
  });

  it("[SWHR2-C-0065] sends the content unchanged", async () => {
    const a = await mailApp();
    const html = "<html><body><p>ご注文ありがとうございます</p></body></html>";
    await a.send.sendMail({ to: "a@example.com", subject: "S", content: html });
    expect(a.outbox[0].html).toBe(html);
  });
});

describe("switches and sequence", () => {
  it("[SWHR2-C-0046] sends nothing with every notification off", async () => {
    const a = await mailApp();
    await a.pendingOrder("1001", [["EST-1", 1]]);
    await a.approve("1001");
    await a.fulfilLines("1001", [["EST-1", 1]]);
    expect(a.outbox).toEqual([]);
  });

  it("[SWHR2-C-0047] sends only a shipment e-mail when only shipment is on", async () => {
    const a = await mailApp({ NOTIFY_SHIPMENT_ENABLED: ON });
    await a.pendingOrder("1002", TWO);
    a.approved("1002");
    await a.fulfilLines("1002", [["EST-1", 2]]);
    expect(a.outbox).toHaveLength(1);
    expect(a.outbox[0].subject).toContain("1002");
    expect(a.outbox[0].subject).not.toMatch(/COMPLETED|Order Status/);
  });

  it("[SWHR2-C-0048] sends only the approval e-mail when only approval is on", async () => {
    const a = await mailApp({ NOTIFY_APPROVAL_ENABLED: ON });
    await a.pendingOrder("1003", TWO);
    await a.approve("1003");
    await a.fulfilLines("1003", [["EST-1", 2]]);
    await a.fulfilLines("1003", [["EST-6", 1]]);
    expect(subjects(a.outbox)).toEqual(["Order Status: 1003"]);
  });

  it("[SWHR2-C-0049] [SWHR2-C-0067] sends no completion e-mail when completion is off", async () => {
    const a = await mailApp({ NOTIFY_SHIPMENT_ENABLED: ON });
    await a.pendingOrder("1004", [["EST-1", 1]]);
    a.approved("1004");
    await a.fulfilLines("1004", [["EST-1", 1]]);
    expect(statusOf(a.client, "1004")).toBe("COMPLETED");
    expect(a.outbox.length).toBeGreaterThanOrEqual(1);
    expect(subjects(a.outbox).join()).not.toMatch(/COMPLETED/);
  });

  it("[SWHR2-C-0056] consumes a shipment trigger whose switch is off, without redelivery", async () => {
    const a = await mailApp({ NOTIFY_COMPLETED_ENABLED: ON });
    await a.pendingOrder("1005", TWO);
    a.approved("1005");
    await a.fulfilLines("1005", [["EST-1", 2]]);
    const row = messages(a.client, "supplier.invoice", "%1005%").find(
      (m) => m.subscriber === "notify.shipment",
    );
    expect(row?.status).toBe("delivered");
    expect(a.outbox).toEqual([]);
    expect(await a.worker.processDue()).toBeFalsy();
  });

  it("[SWHR2-C-0057] sends only the completed-order e-mail when approval is off", async () => {
    const a = await mailApp({ NOTIFY_COMPLETED_ENABLED: ON });
    await a.pendingOrder("1006", [["EST-1", 1]]);
    await a.approve("1006");
    await a.fulfilLines("1006", [["EST-1", 1]]);
    expect(subjects(a.outbox)).toEqual(["Java Pet Store Order COMPLETED: 1006"]);
  });

  it("[SWHR2-C-0058] [SWHR2-C-0060] sends approval, shipment and one completion e-mail in order", async () => {
    const a = await mailApp({
      NOTIFY_APPROVAL_ENABLED: ON,
      NOTIFY_SHIPMENT_ENABLED: ON,
      NOTIFY_COMPLETED_ENABLED: ON,
    });
    await a.pendingOrder("1007", TWO);
    await a.approve("1007");
    await a.fulfilLines("1007", [["EST-1", 2]]);
    await a.fulfilLines("1007", [["EST-6", 1]]);
    const s = subjects(a.outbox);
    expect(s[0]).toBe("Order Status: 1007");
    expect(s.at(-1)).toBe("Java Pet Store Order COMPLETED: 1007");
    expect(s.length).toBeGreaterThanOrEqual(4);
  });

  it("[SWHR2-C-0136] gives one published invoice to both subscribers", async () => {
    const a = await mailApp({ NOTIFY_SHIPMENT_ENABLED: ON });
    await a.pendingOrder("10023", TWO);
    a.approved("10023");
    await a.fulfilLines("10023", [["EST-1", 1]]);
    expect(statusOf(a.client, "10023")).toBe("SHIPPED_PART");
    expect(a.outbox.filter((m) => m.subject.includes("10023"))).toHaveLength(1);
    const rows = messages(a.client, "supplier.invoice", "%10023%");
    expect(rows.map((r) => r.subscriber).sort()).toEqual([
      "notify.shipment",
      "order-processing.invoice",
    ]);
    expect(rows.every((r) => r.status === "delivered")).toBe(true);
  });
});

describe("queues and channels", () => {
  it("[SWHR2-C-0054] one queued request produces exactly one e-mail", async () => {
    const a = await mailApp();
    a.messaging.enqueue(
      a.db,
      "mail.outbound",
      JSON.stringify(["a@example.com", "Order Status: 1001", "<p>status</p>"]),
    );
    await a.drain();
    expect(a.outbox).toHaveLength(1);
    expect(a.outbox[0]).toMatchObject({ to: ["a@example.com"], subject: "Order Status: 1001" });
  });

  it("[SWHR2-C-0055] the producing step returns without waiting for delivery", async () => {
    const a = await mailApp({ NOTIFY_APPROVAL_ENABLED: ON }, { gated: true });
    await a.pendingOrder("1011", [["EST-1", 1]]);
    a.decide.decideBatch(approvalXml("1011", "APPROVED"));
    expect(statusOf(a.client, "1011")).toBe("APPROVED");
    expect(a.outbox).toEqual([]);
    expect(messages(a.client, "notify.approval", "%1011%").length).toBeGreaterThan(0);
    a.release();
    await a.drain();
    expect(subjects(a.outbox)).toEqual(["Order Status: 1011"]);
  });

  it("[SWHR2-C-0061] keeps the approval queued while the mail server is down", async () => {
    const a = await mailApp({ NOTIFY_APPROVAL_ENABLED: ON }, { failConnect: true });
    await a.pendingOrder("1009", [["EST-1", 1]]);
    a.decide.decideBatch(approvalXml("1009", "APPROVED"));
    for (let i = 0; i < 5 && a.attempts() === 0; i++) {
      a.client.exec("update messages set available_at = 0 where status = 'pending'");
      await a.worker.processDue();
    }
    expect(a.attempts()).toBeGreaterThan(0);
    expect(a.outbox).toEqual([]);
    expect(statusOf(a.client, "1009")).toBe("APPROVED");
    expect(messages(a.client, "mail.outbound").some((m) => m.status === "pending")).toBe(true);
  });

  it("[SWHR2-C-0062] approval and completion use separate channels from mail delivery", async () => {
    const a = await mailApp({ NOTIFY_APPROVAL_ENABLED: ON, NOTIFY_COMPLETED_ENABLED: ON });
    await a.pendingOrder("1012", [["EST-1", 1]]);
    await a.pendingOrder("1013", [["EST-1", 1]]);
    a.decide.decideBatch(approvalXml("1012", "APPROVED"));
    a.approved("1013");
    a.invoices.handleInvoice(a.invoiceFor("1013", [["EST-1", 1]]));
    expect(
      messages(a.client, "notify.approval")
        .map((m) => m.payload)
        .join(),
    ).toContain("1012");
    expect(
      messages(a.client, "notify.approval")
        .map((m) => m.payload)
        .join(),
    ).not.toContain("1013");
    expect(
      messages(a.client, "notify.completed")
        .map((m) => m.payload)
        .join(),
    ).toContain("1013");
    expect(messages(a.client, "mail.outbound")).toEqual([]);
  });

  it("[SWHR2-C-0066] the completed-order e-mail lists every line", async () => {
    const a = await mailApp({ NOTIFY_COMPLETED_ENABLED: ON });
    await a.pendingOrder("1001", TWO);
    a.approved("1001");
    await a.fulfilLines("1001", TWO);
    const mail = a.outbox[0] as Sent | undefined;
    expect(mail?.subject).toBe("Java Pet Store Order COMPLETED: 1001");
    expect(mail?.to).toEqual(["c@example.com"]);
    expect(mail?.html).toMatch(/entire order has shipped/i);
    for (const part of ["FISH", "Angelfish", "16.50", "DOGS", "Bulldog", "18.50"])
      expect(mail?.html).toContain(part);
  });

  it("rejects a malformed mail.outbound request: sends nothing and marks it failed", async () => {
    const a = await mailApp();
    a.messaging.enqueue(a.db, "mail.outbound", JSON.stringify(["a@example.com", "S"]));
    await a.drain();
    expect(a.outbox).toEqual([]);
    const rows = messages(a.client, "mail.outbound");
    expect(rows[0].status).toBe("failed");
  });
});
