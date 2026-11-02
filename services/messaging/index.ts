import { messages } from "../../db/schema";
import type { Executor } from "../ids";

/**
 * Publish/subscribe channels and their subscribers (SWHR2-R-0109). A message on a channel listed
 * here is written once per subscriber, so each consumes its own copy; every other channel is
 * point-to-point. A later capability appends its subscriber to a list.
 */
export const SUBSCRIBERS: Record<string, string[]> = {
  "supplier.invoice": ["order-processing.invoice", "notify.shipment"],
};

/**
 * Writes the message to the outbox inside the caller's transaction, due at once, so it commits or
 * rolls back with the caller's state changes (SWHR2-R-0140). Returns the id of the first row.
 */
export function enqueue(tx: Executor, channel: string, payload: string): number {
  const now = Date.now();
  const targets: (string | null)[] = SUBSCRIBERS[channel] ?? [null];
  const ids = targets.map(
    (subscriber) =>
      tx
        .insert(messages)
        .values({
          channel,
          subscriber,
          payload,
          status: "pending",
          attempts: 0,
          createdAt: now,
          availableAt: now,
        })
        .returning({ id: messages.id })
        .get().id,
  );
  return ids[0];
}
