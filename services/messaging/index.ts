import { messages } from "../../db/schema";
import type { Executor } from "../ids";

/** Writes a pending message to the outbox inside the caller's transaction; due at once. */
export function enqueue(tx: Executor, channel: string, payload: string): number {
  const now = Date.now();
  return tx
    .insert(messages)
    .values({ channel, payload, status: "pending", createdAt: now, availableAt: now })
    .returning({ id: messages.id })
    .get().id;
}
