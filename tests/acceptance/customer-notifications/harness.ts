import { vi } from "vitest";

import {
  approvalXml,
  fulfilment,
  messages,
  mod,
  purchaseOrder,
} from "../order-fulfillment/harness";

export { approvalXml, messages, mod };

export interface Sent {
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  html: string;
  text: string;
}

const ENV_KEYS = [
  "NOTIFY_APPROVAL_ENABLED",
  "NOTIFY_SHIPMENT_ENABLED",
  "NOTIFY_COMPLETED_ENABLED",
  "MAIL_HOST",
  "MAIL_PORT",
  "MAIL_USER",
  "MAIL_PASSWORD",
  "MAIL_FROM",
];
export const resetEnv = () => ENV_KEYS.forEach((k) => delete process.env[k]);

const list = (v: unknown): string[] =>
  v == null || v === ""
    ? []
    : (Array.isArray(v) ? v : String(v).split(","))
        .map((a) =>
          (typeof a === "string" ? a : ((a as { address?: string }).address ?? "")).trim(),
        )
        .filter(Boolean);

/**
 * Starts the app with the given deployment settings and nodemailer replaced by a capturing transport.
 * `failConnect` makes every send fail; `gate` makes every send wait for `gate.release()`.
 */
export async function mailApp(
  env: Record<string, string> = {},
  opts: { failConnect?: boolean; gated?: boolean } = {},
) {
  resetEnv();
  Object.assign(process.env, env);
  const outbox: Sent[] = [];
  /** The message objects exactly as the app handed them to the transport. */
  const raw: Record<string, unknown>[] = [];
  const created: { host?: string; auth?: { user?: string } }[] = [];
  let attempts = 0;
  let release: () => void = () => undefined;
  let open = !opts.gated;
  const opened = new Promise<void>((res) => {
    release = () => {
      open = true;
      res();
    };
  });
  const createTransport = (options: { host?: string; auth?: { user?: string } }) => {
    created.push(options);
    return {
      sendMail: async (m: Record<string, unknown>) => {
        attempts++;
        if (opts.failConnect) throw new Error("connect ECONNREFUSED");
        if (!open) await opened;
        raw.push(m);
        outbox.push({
          from: list(m.from)[0] ?? "",
          to: list(m.to),
          cc: list(m.cc),
          bcc: list(m.bcc),
          subject: String(m.subject ?? ""),
          html: String(m.html ?? ""),
          text: String(m.text ?? ""),
        });
        return { messageId: "test" };
      },
    };
  };
  vi.doMock("nodemailer", () => ({ default: { createTransport }, createTransport }));
  const f = await fulfilment();
  const send = await mod("../../../services/notifications/send");
  const config = await mod("../../../services/notifications/config");

  /** A stored order with a PENDING workflow record. */
  const pendingOrder = async (
    orderId: string,
    lines: [string, number][],
    extra: { locale?: string; email?: string } = {},
  ) => {
    const po = purchaseOrder(orderId, lines);
    po.email = extra.email ?? "c@example.com";
    po.locale = extra.locale ?? "en_US";
    po.lines.forEach((l, i) => {
      l.productId = i === 0 ? "Angelfish" : "Bulldog";
      l.categoryId = i === 0 ? "FISH" : "DOGS";
      l.unitPrice = i === 0 ? 1650 : 1850;
    });
    await f.receive.createPurchaseOrder(f.db, po);
    f.client.exec(
      `insert into op_order_workflow (order_id, status) values ('${orderId}', 'PENDING')`,
    );
    return po;
  };
  const approve = async (orderId: string) => {
    f.messaging.enqueue(f.db, "order.approval", approvalXml(orderId, "APPROVED"));
    await f.drain();
  };
  const fulfilLines = async (orderId: string, lines: [string, number][]) => {
    f.messaging.enqueue(f.db, "supplier.invoice", f.invoiceFor(orderId, lines));
    await f.drain();
  };
  /** How many times the app has tried to hand an e-mail to the mail server. */
  const sendAttempts = () => attempts;
  return {
    ...f,
    send,
    config,
    outbox,
    raw,
    created,
    release,
    sendAttempts,
    pendingOrder,
    approve,
    fulfilLines,
  };
}

export const subjects = (outbox: Sent[]) => outbox.map((m) => m.subject);
