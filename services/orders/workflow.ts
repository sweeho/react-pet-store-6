import { eq } from "drizzle-orm";

import { db } from "../../db/client";
import { opOrderWorkflow } from "../../db/schema";
import type { Executor } from "../ids";

export const ORDER_STATUSES = [
  "PENDING",
  "APPROVED",
  "DENIED",
  "SHIPPED_PART",
  "COMPLETED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** The only moves the lifecycle allows; DENIED and COMPLETED are end states (SWHR2-R-0024). */
const NEXT: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["APPROVED", "DENIED"],
  APPROVED: ["SHIPPED_PART", "COMPLETED"],
  SHIPPED_PART: ["COMPLETED"],
  DENIED: [],
  COMPLETED: [],
};

/** No workflow record exists for the order id. */
export class OrderNotFound extends Error {
  override readonly name = "NotFound";
  readonly status = 404;
  constructor(orderId: string) {
    super(`Order ${orderId} not found.`);
  }
}

/** Starts the order's workflow with the given status; an order id already started fails and keeps its record (SWHR2-R-0107). */
export function startWorkflow(exec: Executor, orderId: string, status: OrderStatus): void {
  exec.insert(opOrderWorkflow).values({ orderId, status }).run();
}

/** The order's current status, or an `OrderNotFound` error (SWHR2-R-0108). */
export function getOrderStatus(orderId: string): OrderStatus {
  const row = db.select().from(opOrderWorkflow).where(eq(opOrderWorkflow.orderId, orderId)).get();
  if (!row) throw new OrderNotFound(orderId);
  return row.status as OrderStatus;
}

/**
 * Every status write goes through here: moves the order to `to` only when the lifecycle allows it
 * from its current status. Returns whether the status changed; anything else is ignored.
 */
export function setStatus(exec: Executor, orderId: string, to: OrderStatus): boolean {
  const row = exec.select().from(opOrderWorkflow).where(eq(opOrderWorkflow.orderId, orderId)).get();
  if (!row || !NEXT[row.status as OrderStatus]?.includes(to)) return false;
  exec
    .update(opOrderWorkflow)
    .set({ status: to })
    .where(eq(opOrderWorkflow.orderId, orderId))
    .run();
  return true;
}
