import { and, asc, eq, lte, sql } from "drizzle-orm";

import { db } from "../../db/client";
import { messages } from "../../db/schema";
import { decideBatch } from "../orders/decide";
import { handleInvoice } from "../orders/invoice";
import { receiveOrderMessage } from "../orders/receive";
import { receiveSupplierPurchaseOrder, refulfil } from "../supplier/fulfil";
import type { Executor } from "../ids";

/** Seconds a failed delivery waits before the next attempt. */
const RETRY_DELAY_MS = 30_000;

/** A channel's handler gets the message payload and runs inside the delivery transaction. */
export type Handler = (tx: Executor, payload: string) => void;

// Keyed by channel, or by `channel/subscriber` on a publish/subscribe channel (design.md P1). They
// live here so a freshly imported worker can deliver without any set-up (SWHR2-R-0109.03).
const handlers: Record<string, Handler> = {
  "order.new": receiveOrderMessage,
  "order.approval": (tx, payload) => decideBatch(payload, tx),
  "supplier.purchase-order": receiveSupplierPurchaseOrder,
  "supplier.inventory-changed": refulfil,
  "supplier.invoice/order-processing.invoice": (tx, payload) => handleInvoice(payload, tx),
};

/**
 * Delivers every pending message that is due, oldest first. A handler runs and the row is set to
 * `delivered` in one transaction; a handler that throws rolls back, records the error and leaves
 * the row pending, due again after a delay. Returns how many messages were delivered.
 */
export async function processDue(): Promise<number> {
  const due = db
    .select({
      id: messages.id,
      channel: messages.channel,
      subscriber: messages.subscriber,
      payload: messages.payload,
    })
    .from(messages)
    .where(and(eq(messages.status, "pending"), lte(messages.availableAt, Date.now())))
    .orderBy(asc(messages.id))
    .all();
  let delivered = 0;
  for (const { id, channel, subscriber, payload } of due) {
    const handle = handlers[subscriber ? `${channel}/${subscriber}` : channel];
    if (!handle) continue;
    try {
      db.transaction((tx) => {
        handle(tx, payload);
        tx.update(messages).set({ status: "delivered" }).where(eq(messages.id, id)).run();
      });
      delivered++;
    } catch (e) {
      db.update(messages)
        .set({
          error: e instanceof Error ? e.message : String(e),
          attempts: sql`${messages.attempts} + 1`,
          availableAt: Date.now() + RETRY_DELAY_MS,
        })
        .where(eq(messages.id, id))
        .run();
    }
  }
  return delivered;
}

/** Polls the outbox in this process; returns a function that stops it. */
export function startWorker(intervalMs = 500): () => void {
  let running = false;
  const timer = setInterval(() => {
    if (running) return;
    running = true;
    processDue()
      .catch(() => undefined)
      .finally(() => {
        running = false;
      });
  }, intervalMs);
  return () => clearInterval(timer);
}
