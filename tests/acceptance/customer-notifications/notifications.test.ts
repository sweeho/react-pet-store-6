// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";

import { approvalXml, mailApp, messages, resetEnv, subjects } from "./harness";

afterEach(resetEnv);

const ON = "true";
const ALL = {
  NOTIFY_APPROVAL_ENABLED: ON,
  NOTIFY_SHIPMENT_ENABLED: ON,
  NOTIFY_COMPLETED_ENABLED: ON,
};
const TWO: [string, number][] = [
  ["EST-1", 2],
  ["EST-6", 1],
];

describe("notification switches", () => {
  // case: SWHR2-C-0046@v1
  it("SWHR2-C-0046: with no notification enabled, approving and fully fulfilling an order sends no customer e-mail", async () => {
    const a = await mailApp();
    await a.pendingOrder("1001", [["EST-1", 1]]);
    await a.approve("1001");
    await a.fulfilLines("1001", [["EST-1", 1]]);
    expect(a.outbox.filter((m) => m.to.includes("c@example.com"))).toEqual([]);
  });

  // case: SWHR2-C-0047@v1
  it("SWHR2-C-0047: with only confirmation enabled, a partial fulfilment sends one confirmation e-mail and nothing else", async () => {
    const a = await mailApp({ NOTIFY_SHIPMENT_ENABLED: ON });
    await a.pendingOrder("1002", TWO);
    a.client.exec("update op_order_workflow set status = 'APPROVED' where order_id = '1002'");
    await a.fulfilLines("1002", [["EST-1", 2]]);
    expect(a.outbox).toHaveLength(1);
    expect(a.outbox[0].to).toEqual(["c@example.com"]);
    expect(a.outbox[0].subject).not.toMatch(/COMPLETED|Order Status/);
    expect(a.config.notificationSwitches()).toMatchObject({ approval: false, completed: false });
  });

  // case: SWHR2-C-0048@v1
  it("SWHR2-C-0048: with only approval enabled, approve, partial and full fulfilment produce only the approval e-mail", async () => {
    const a = await mailApp({ NOTIFY_APPROVAL_ENABLED: ON });
    await a.pendingOrder("1003", TWO);
    await a.approve("1003");
    await a.fulfilLines("1003", [["EST-1", 2]]);
    await a.fulfilLines("1003", [["EST-6", 1]]);
    expect(subjects(a.outbox)).toEqual(["Order Status: 1003"]);
  });

  // case: SWHR2-C-0049@v1
  it("SWHR2-C-0049: with completion disabled, completely fulfilling an order sends no completion e-mail", async () => {
    const a = await mailApp({ NOTIFY_APPROVAL_ENABLED: ON, NOTIFY_SHIPMENT_ENABLED: ON });
    await a.pendingOrder("1004", [["EST-1", 1]]);
    a.client.exec("update op_order_workflow set status = 'APPROVED' where order_id = '1004'");
    await a.fulfilLines("1004", [["EST-1", 1]]);
    expect(subjects(a.outbox)).not.toContain("Java Pet Store Order COMPLETED: 1004");
  });

  // case: SWHR2-C-0056@v1
  it("SWHR2-C-0056: with shipment notification off, a partial invoice is consumed, sends no e-mail and is not redelivered", async () => {
    const a = await mailApp({ NOTIFY_APPROVAL_ENABLED: ON, NOTIFY_COMPLETED_ENABLED: ON });
    await a.pendingOrder("1005", TWO);
    a.client.exec("update op_order_workflow set status = 'APPROVED' where order_id = '1005'");
    await a.fulfilLines("1005", [["EST-1", 2]]);
    const row = messages(a.client, "supplier.invoice", "%1005%").find(
      (m) => m.subscriber === "notify.shipment",
    )!;
    expect(row.status).toBe("delivered");
    expect(a.outbox).toEqual([]);
    expect(await a.worker.processDue()).toBeFalsy();
  });

  // case: SWHR2-C-0057@v1
  it("SWHR2-C-0057: with approval off and completion on, approving then completing sends only the completed-order e-mail", async () => {
    const a = await mailApp({ NOTIFY_COMPLETED_ENABLED: ON });
    await a.pendingOrder("1006", [["EST-1", 1]]);
    await a.approve("1006");
    await a.fulfilLines("1006", [["EST-1", 1]]);
    expect(subjects(a.outbox)).toEqual(["Java Pet Store Order COMPLETED: 1006"]);
  });

  // case: SWHR2-C-0058@v1
  it("SWHR2-C-0058: an order fulfilled in two shipments sends approval, shipment e-mails and one completion e-mail", async () => {
    const a = await mailApp(ALL);
    await a.pendingOrder("1007", TWO);
    await a.approve("1007");
    await a.fulfilLines("1007", [["EST-1", 2]]);
    await a.fulfilLines("1007", [["EST-6", 1]]);
    const s = subjects(a.outbox);
    expect(s[0]).toBe("Order Status: 1007");
    expect(s.at(-1)).toBe("Java Pet Store Order COMPLETED: 1007");
    expect(s.filter((x) => x === "Order Status: 1007")).toHaveLength(1);
    expect(s.filter((x) => x === "Java Pet Store Order COMPLETED: 1007")).toHaveLength(1);
    // every other e-mail is a shipment confirmation: exactly one per shipment, between the two
    const shipments = s.slice(1, -1);
    expect(shipments).toHaveLength(2);
    for (const x of shipments) expect(x).not.toMatch(/^Order Status:|COMPLETED/);
  });

  // case: SWHR2-C-0060@v1
  it("SWHR2-C-0060: a single-shipment order sends one approval, fulfilment e-mails and one final completion e-mail", async () => {
    const a = await mailApp(ALL);
    await a.pendingOrder("1008", [["EST-1", 1]]);
    await a.approve("1008");
    await a.fulfilLines("1008", [["EST-1", 1]]);
    const s = subjects(a.outbox);
    expect(s[0]).toBe("Order Status: 1008");
    expect(s.at(-1)).toBe("Java Pet Store Order COMPLETED: 1008");
    expect(s.filter((x) => x === "Order Status: 1008")).toHaveLength(1);
    expect(s.filter((x) => x === "Java Pet Store Order COMPLETED: 1008")).toHaveLength(1);
    // every other e-mail is a shipment confirmation: exactly one per shipment, between the two
    const shipments = s.slice(1, -1);
    expect(shipments).toHaveLength(1);
    for (const x of shipments) expect(x).not.toMatch(/^Order Status:|COMPLETED/);
  });
});

describe("queues and channels", () => {
  // case: SWHR2-C-0054@v1
  it("SWHR2-C-0054: one queued request for a@example.com produces exactly one e-mail", async () => {
    const a = await mailApp();
    a.messaging.enqueue(
      a.db,
      "mail.outbound",
      JSON.stringify(["a@example.com", "Order Status: 1001", "<p>status</p>"]),
    );
    await a.drain();
    expect(a.outbox).toHaveLength(1);
    expect(a.outbox[0]).toMatchObject({ to: ["a@example.com"], subject: "Order Status: 1001" });
    expect(a.outbox[0].html || a.outbox[0].text).toBe("<p>status</p>");
  });

  // case: SWHR2-C-0055@v1
  it("SWHR2-C-0055: an order-processing step returns after enqueuing the e-mail, without waiting for delivery", async () => {
    const a = await mailApp({ NOTIFY_APPROVAL_ENABLED: "true" }, { gated: true });
    await a.pendingOrder("1011", [["EST-1", 1]]);
    await a.decide.decideBatch(approvalXml("1011", "APPROVED"));
    expect(
      a.client.query("select status from op_order_workflow where order_id = '1011'").get(),
    ).toEqual({ status: "APPROVED" });
    expect(a.outbox).toEqual([]);
    expect(messages(a.client, "notify.approval", "%1011%").length).toBeGreaterThan(0);
    a.release();
    await a.drain();
    expect(subjects(a.outbox)).toEqual(["Order Status: 1011"]);
  });

  // case: SWHR2-C-0061@v1
  it("SWHR2-C-0061: with the mail server down the approval notification is queued on its channel and approval completes", async () => {
    const a = await mailApp({ NOTIFY_APPROVAL_ENABLED: "true" }, { failConnect: true });
    await a.pendingOrder("1009", [["EST-1", 1]]);
    await expect(
      Promise.resolve(a.decide.decideBatch(approvalXml("1009", "APPROVED"))),
    ).resolves.not.toThrow();
    expect(
      a.client.query("select status from op_order_workflow where order_id = '1009'").get(),
    ).toEqual({ status: "APPROVED" });
    const waiting = messages(a.client, "notify.approval", "%1009%");
    expect(waiting).toHaveLength(1);
    expect(waiting[0].status).toBe("pending");
  });

  // case: SWHR2-C-0062@v1
  it("SWHR2-C-0062: approval and completed-order notifications go to separate channels, distinct from mail delivery", async () => {
    const a = await mailApp(ALL);
    await a.pendingOrder("1012", [["EST-1", 1]]);
    await a.pendingOrder("1013", [["EST-1", 1]]);
    await a.decide.decideBatch(approvalXml("1012", "APPROVED"));
    a.client.exec("update op_order_workflow set status = 'APPROVED' where order_id = '1013'");
    await a.invoices.handleInvoice(a.invoiceFor("1013", [["EST-1", 1]]));
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
    expect(
      messages(a.client, "notify.completed")
        .map((m) => m.payload)
        .join(),
    ).not.toContain("1012");
    expect(messages(a.client, "mail.outbound")).toEqual([]);
  });

  // case: SWHR2-C-0066@v1
  it("SWHR2-C-0066: completed order 1001 (en_US, two lines) sends the English COMPLETED e-mail listing both lines", async () => {
    const a = await mailApp({ NOTIFY_COMPLETED_ENABLED: "true" });
    await a.pendingOrder("1001", [
      ["EST-1", 2],
      ["EST-6", 1],
    ]);
    a.client.exec("update op_order_workflow set status = 'APPROVED' where order_id = '1001'");
    await a.fulfilLines("1001", [
      ["EST-1", 2],
      ["EST-6", 1],
    ]);
    const mail = a.outbox.find((m) => m.to.includes("c@example.com"))!;
    expect(mail.subject).toBe("Java Pet Store Order COMPLETED: 1001");
    const body = mail.html || mail.text;
    expect(body).toMatch(/entire order has shipped/i);
    for (const part of ["FISH", "Angelfish", "16.50", "DOGS", "Bulldog", "18.50"])
      expect(body).toContain(part);
  });

  // case: SWHR2-C-0067@v1
  it("SWHR2-C-0067: with completed-order mail disabled, a COMPLETED order sends no completed-order e-mail", async () => {
    const a = await mailApp({ NOTIFY_APPROVAL_ENABLED: "true", NOTIFY_SHIPMENT_ENABLED: "true" });
    await a.pendingOrder("1010", [["EST-1", 1]]);
    a.client.exec("update op_order_workflow set status = 'APPROVED' where order_id = '1010'");
    await a.fulfilLines("1010", [["EST-1", 1]]);
    expect(subjects(a.outbox)).not.toContain("Java Pet Store Order COMPLETED: 1010");
  });
});
