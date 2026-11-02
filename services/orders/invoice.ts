import { and, asc, eq } from "drizzle-orm";

import { db } from "../../db/client";
import { opOrderWorkflow, opPoLineItems } from "../../db/schema";
import { readInvoiceDocument } from "../documents/invoice";
import type { Executor } from "../ids";
import { enqueue } from "../messaging";
import { setStatus } from "./workflow";

export interface InvoiceRead {
  orderId: string;
  lines: { itemId: string; quantity: number }[];
  /** Shipped quantity per item. */
  shipped: Record<string, number>;
}

/** Reads an invoice into the order id and the shipped quantities; any other document throws (SWHR2-R-0092). */
export function readInvoice(xml: string): InvoiceRead {
  const doc = readInvoiceDocument(xml);
  const shipped: Record<string, number> = {};
  for (const l of doc.lines) shipped[l.itemId] = (shipped[l.itemId] ?? 0) + l.quantity;
  return {
    orderId: doc.orderId,
    lines: doc.lines.map(({ itemId, quantity }) => ({ itemId, quantity })),
    shipped,
  };
}

/**
 * Applies one invoice in one transaction. Each invoiced quantity goes to that item's lines in line
 * order, no line past its ordered quantity; the order becomes SHIPPED_PART while a line is short and
 * COMPLETED when none is. An order that is not APPROVED or SHIPPED_PART is left unchanged and the
 * invoice is consumed (SWHR2-R-0024, SWHR2-R-0096, design SD8, SD9).
 */
export function handleInvoice(xml: string, exec: Executor = db): void {
  const invoice = readInvoice(xml);
  exec.transaction((tx) => {
    const wf = tx
      .select()
      .from(opOrderWorkflow)
      .where(eq(opOrderWorkflow.orderId, invoice.orderId))
      .get();
    if (wf?.status !== "APPROVED" && wf?.status !== "SHIPPED_PART") return;
    const lines = tx
      .select()
      .from(opPoLineItems)
      .where(eq(opPoLineItems.orderId, invoice.orderId))
      .orderBy(asc(opPoLineItems.lineNumber))
      .all();
    for (const { itemId, quantity } of invoice.lines) {
      let left = quantity;
      for (const l of lines.filter((x) => x.itemId === itemId)) {
        const add = Math.min(left, l.quantity - l.quantityShipped);
        if (add <= 0) continue;
        l.quantityShipped += add;
        left -= add;
        tx.update(opPoLineItems)
          .set({ quantityShipped: l.quantityShipped })
          .where(
            and(
              eq(opPoLineItems.orderId, invoice.orderId),
              eq(opPoLineItems.lineNumber, l.lineNumber),
            ),
          )
          .run();
      }
    }
    const done = lines.every((l) => l.quantityShipped >= l.quantity);
    setStatus(tx, invoice.orderId, done ? "COMPLETED" : "SHIPPED_PART");
    if (done) enqueue(tx, "notify.completed", JSON.stringify({ orderId: invoice.orderId }));
  });
}
