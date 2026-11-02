import { eq } from "drizzle-orm";
import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { db } from "../../db/client";
import { opOrderWorkflow } from "../../db/schema";
import type { Executor } from "../ids";

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

/** Moves a PENDING order to APPROVED or DENIED; any other order or value is left unchanged. */
export function applyDecision(tx: Executor, orderId: string, status: string): void {
  if (status !== "APPROVED" && status !== "DENIED") return;
  const row = tx.select().from(opOrderWorkflow).where(eq(opOrderWorkflow.orderId, orderId)).get();
  if (row?.status !== "PENDING") return;
  tx.update(opOrderWorkflow).set({ status }).where(eq(opOrderWorkflow.orderId, orderId)).run();
}

/** Applies every entry of an approval document in one transaction. */
export function decideBatch(xml: string, exec: Executor = db): void {
  const entries = readApprovalBatch(xml);
  exec.transaction((tx) => {
    for (const e of entries) applyDecision(tx, e.orderId, e.status);
  });
}
