import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { db } from "../../db/client";
import { buildSupplierOrder } from "../documents/supplier-order";
import type { Executor } from "../ids";
import { enqueue } from "../messaging";
import { readPurchaseOrder } from "./receive";
import { handOff } from "./transitions";
import { setStatus } from "./workflow";

export const ORDER_APPROVAL_CHANNEL = "order.approval";

export interface DecisionEntry {
  orderId: string;
  status: string;
}

const parser = new XMLParser({ parseTagValue: false, trimValues: true });
const builder = new XMLBuilder({ format: false });

/** The approval document: one `Order` entry per decision, the status written as free text. */
export function toApprovalXml(entries: DecisionEntry[]): string {
  return builder.build({
    OrderApproval: { Order: entries.map((e) => ({ OrderId: e.orderId, OrderStatus: e.status })) },
  });
}

/** Reads an approval document; every status is accepted as written (SWHR2-R-0082). */
export function readApprovalBatch(xml: string): DecisionEntry[] {
  const root = (parser.parse(xml) as { OrderApproval?: { Order?: unknown } }).OrderApproval;
  if (!root || typeof root !== "object") throw new Error("OrderApproval element expected.");
  const orders = root.Order === undefined ? [] : [root.Order].flat();
  if (orders.length === 0) throw new Error("At least one Order element expected.");
  return orders.map((o) => {
    const n = o as { OrderId?: unknown; OrderStatus?: unknown };
    if (typeof n.OrderId !== "string" || n.OrderId === "")
      throw new Error("Order element needs an OrderId.");
    if (typeof n.OrderStatus !== "string") throw new Error("Order element needs an OrderStatus.");
    return { orderId: n.OrderId, status: n.OrderStatus };
  });
}

/**
 * Moves a PENDING order to APPROVED or DENIED; any other order, value or current status is left
 * unchanged. An order that becomes APPROVED is handed to the supplier as a supplier order document
 * in the same transaction, so a failed hand-off undoes the approval (SWHR2-R-0100, SWHR2-R-0140).
 */
export function applyDecision(tx: Executor, orderId: string, status: string): void {
  if (status !== "APPROVED" && status !== "DENIED") return;
  if (!setStatus(tx, orderId, status)) return;
  // Only enqueue: the notification handler decides, on its own switch, whether mail goes out.
  enqueue(tx, "notify.approval", JSON.stringify({ orderId, status }));
  if (status !== "APPROVED") return;
  const po = readPurchaseOrder(tx, orderId);
  if (!po) throw new Error(`Approved order ${orderId} has no stored purchase order.`);
  const xml = buildSupplierOrder({
    orderId: po.orderId,
    userId: po.userId,
    orderDate: new Date(po.orderDate).toISOString(),
    shipping: {
      firstName: po.shipping.givenName,
      lastName: po.shipping.familyName,
      street: po.shipping.street,
      city: po.shipping.city,
      state: po.shipping.state,
      country: po.shipping.country,
      zip: po.shipping.zip,
      email: po.shipping.email,
      phone: po.shipping.phone,
    },
    lines: po.lines,
  });
  handOff("approval", [xml], tx);
}

/** Applies every entry of an approval document in one transaction. */
export function decideBatch(xml: string, exec: Executor = db): void {
  const entries = readApprovalBatch(xml);
  exec.transaction((tx) => {
    for (const e of entries) applyDecision(tx, e.orderId, e.status);
  });
}
