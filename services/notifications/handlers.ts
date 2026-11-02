import { eq } from "drizzle-orm";

import { opPoLineItems, opPurchaseOrders } from "../../db/schema";
import { formatMoney } from "../../shared/i18n/format";
import { readInvoiceDocument } from "../documents/invoice";
import type { Executor } from "../ids";
import { enqueue } from "../messaging";
import { notificationSwitches } from "./config";
import { enUS } from "./templates/en_US";
import { jaJP } from "./templates/ja_JP";
import type { Templates } from "./templates/types";
import { zhCN } from "./templates/zh_CN";

const TEMPLATES: Record<string, Templates> = { en_US: enUS, ja_JP: jaJP, zh_CN: zhCN };

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Puts one e-mail on the outbound channel for the order's e-mail address; no order, no mail. */
function queueMail(
  tx: Executor,
  orderId: string,
  subject: string,
  body: (t: Templates, locale: string) => string,
): void {
  const order = tx
    .select()
    .from(opPurchaseOrders)
    .where(eq(opPurchaseOrders.orderId, orderId))
    .get();
  if (!order || !order.email) return;
  const t = TEMPLATES[order.locale] ?? enUS;
  enqueue(tx, "mail.outbound", JSON.stringify([order.email, subject, body(t, order.locale)]));
}

/** `notify.approval` `{ orderId, status }`. A switched-off notification returns, consuming the trigger. */
export function onApproval(tx: Executor, payload: string): void {
  if (!notificationSwitches().approval) return;
  const { orderId, status } = JSON.parse(payload) as { orderId: string; status: string };
  queueMail(tx, orderId, `Order Status: ${orderId}`, (t) =>
    t.approval(escape(orderId), escape(status)),
  );
}

/** `supplier.invoice` copy for `notify.shipment`: the payload is the invoice document. */
export function onShipment(tx: Executor, payload: string): void {
  if (!notificationSwitches().shipment) return;
  const { orderId } = readInvoiceDocument(payload);
  queueMail(tx, orderId, `Java Pet Store Order Shipment: ${orderId}`, (t) =>
    t.shipment(escape(orderId)),
  );
}

/** `notify.completed` `{ orderId }`. */
export function onCompleted(tx: Executor, payload: string): void {
  if (!notificationSwitches().completed) return;
  const { orderId } = JSON.parse(payload) as { orderId: string };
  queueMail(tx, orderId, `Java Pet Store Order COMPLETED: ${orderId}`, (t, locale) => {
    const lines = tx
      .select()
      .from(opPoLineItems)
      .where(eq(opPoLineItems.orderId, orderId))
      .orderBy(opPoLineItems.lineNumber)
      .all();
    return t.completed(
      escape(orderId),
      lines.map((l) => ({
        category: escape(l.categoryId),
        product: escape(l.productId),
        quantity: l.quantity,
        unitPrice: formatMoney(l.unitPrice / 100, locale, locale === "ja_JP" ? 0 : 2),
      })),
    );
  });
}
