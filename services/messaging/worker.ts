import { and, asc, eq, lte } from "drizzle-orm";

import { db } from "../../db/client";
import { messages } from "../../db/schema";
import { decideBatch } from "../orders/decide";
import { receiveOrderMessage } from "../orders/receive";
import type { Executor } from "../ids";

/** Seconds a failed delivery waits before the next attempt. */
const RETRY_DELAY_MS = 30_000;

/** A channel's handler gets the message payload and runs inside the delivery transaction. */
export type Handler = (tx: Executor, payload: string) => void;

// Channels order processing consumes (design.md P1).
const handlers: Record<string, Handler> = {
  "order.new": receiveOrderMessage,
  "order.approval": (tx, payload) => decideBatch(payload, tx),
};

/**
 * Delivers every pending message that is due, oldest first. A handler runs and the row is set to
 * `delivered` in one transaction; a handler that throws rolls back, records the error and leaves
 * the row pending, due again after a delay. Returns how many messages were delivered.
 */
export async function processDue(): Promise<number> {
  const due = db
    .select({ id: messages.id, channel: messages.channel, payload: messages.payload })
    .from(messages)
    .where(and(eq(messages.status, "pending"), lte(messages.availableAt, Date.now())))
    .orderBy(asc(messages.id))
    .all();
  let delivered = 0;
  for (const { id, channel, payload } of due) {
    const handle = handlers[channel];
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
