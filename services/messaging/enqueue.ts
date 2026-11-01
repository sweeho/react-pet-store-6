import { messages } from "../../db/schema";
import type { db } from "../../db/client";

/** `db` or a transaction on it: a message enqueued through a transaction joins the caller's unit of work. */
type Unit = Pick<typeof db, "insert">;

/** The channel carrying a placed order's `PurchaseOrder` document to order processing. */
export const ORDER_NEW = "order.new";

/** Queues a message on a channel as pending; order processing delivers it after the caller commits. */
export function enqueue(unit: Unit, channel: string, payload: string): void {
  const now = Date.now();
  unit.insert(messages).values({ channel, payload, availableAt: now, createdAt: now }).run();
}
