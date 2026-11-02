import { and, asc, eq } from "drizzle-orm";

import { db } from "../../db/client";
import { messages } from "../../db/schema";
import type { Executor } from "../ids";

/** Writes a pending message to the outbox inside the caller's transaction. */
export function enqueue(tx: Executor, channel: string, payload: string): number {
  return tx
    .insert(messages)
    .values({ channel, payload, status: "pending", createdAt: Date.now() })
    .returning({ id: messages.id })
    .get().id;
}

/** A channel's handler gets the id of one pending message and marks it done itself, in its own transaction. */
export type Handlers = Record<string, (messageId: number) => Promise<void>>;

/** Handles each pending message once, oldest first; a handler that throws marks its message failed. */
export async function drain(handlers: Handlers): Promise<void> {
  for (const [channel, handle] of Object.entries(handlers)) {
    const pending = db
      .select({ id: messages.id })
      .from(messages)
      .where(and(eq(messages.channel, channel), eq(messages.status, "pending")))
      .orderBy(asc(messages.id))
      .all();
    for (const { id } of pending) {
      try {
        await handle(id);
      } catch (e) {
        db.update(messages)
          .set({ status: "failed", error: e instanceof Error ? e.message : String(e) })
          .where(eq(messages.id, id))
          .run();
      }
    }
  }
}

/** Polls the outbox in this process; returns a function that stops it. */
export function startWorker(handlers: Handlers, intervalMs = 500): () => void {
  let running = false;
  const timer = setInterval(() => {
    if (running) return;
    running = true;
    drain(handlers)
      .catch(() => undefined)
      .finally(() => {
        running = false;
      });
  }, intervalMs);
  return () => clearInterval(timer);
}
