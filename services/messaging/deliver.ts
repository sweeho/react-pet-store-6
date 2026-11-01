import { and, asc, eq, lte } from "drizzle-orm";

import { db } from "../../db/client";
import { messages } from "../../db/schema";

const MAX_ATTEMPTS = 5;

export type Handlers = Record<string, (payload: string) => void>;

/**
 * Delivers every due pending message to its channel's handler. A handler that throws leaves the
 * message pending for another try, then failed after the last attempt. Returns how many were delivered.
 */
export function deliverPending(handlers: Handlers): number {
  const due = db
    .select()
    .from(messages)
    .where(and(eq(messages.status, "pending"), lte(messages.availableAt, Date.now())))
    .orderBy(asc(messages.id))
    .all();
  let delivered = 0;
  for (const m of due) {
    const handler = handlers[m.channel];
    if (!handler) continue;
    try {
      handler(m.payload);
      db.update(messages).set({ status: "delivered" }).where(eq(messages.id, m.id)).run();
      delivered++;
    } catch {
      const attempts = m.attempts + 1;
      db.update(messages)
        .set({ attempts, status: attempts >= MAX_ATTEMPTS ? "failed" : "pending" })
        .where(eq(messages.id, m.id))
        .run();
    }
  }
  return delivered;
}
