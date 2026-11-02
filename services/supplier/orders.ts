import { eq } from "drizzle-orm";

import { db } from "../../db/client";
import { supOrderContacts, supOrderLines, supOrders } from "../../db/schema";
import { toDate } from "../documents/supplier-order";
import type { SupplierOrderInput } from "../documents/supplier-order";
import type { Executor } from "../ids";

/**
 * Stores the supplier order PENDING with its shipping contact and lines (shipped 0), all in one
 * transaction: if any part cannot be stored none is. An order id already stored is refused and the
 * stored order is unchanged (SWHR2-R-0101, SWHR2-R-0102, SWHR2-R-0103, SWHR2-R-0105).
 */
export function createSupplierOrder(exec: Executor, input: SupplierOrderInput): void {
  const { orderId, userId, orderDate } = input;
  if (!orderId || userId == null || !orderDate)
    throw new Error("A supplier order needs an order id, user id and date.");
  const s = input.shipping;
  exec.transaction((tx) => {
    tx.insert(supOrders)
      .values({ orderId, status: "PENDING", orderDate: toDate(orderDate), userId })
      .run();
    tx.insert(supOrderContacts)
      .values({
        orderId,
        firstName: s.firstName ?? "",
        lastName: s.lastName ?? "",
        street: s.street ?? "",
        city: s.city ?? "",
        state: s.state ?? "",
        country: s.country ?? "",
        zip: s.zip ?? "",
        email: s.email ?? "",
        phone: s.phone ?? "",
      })
      .run();
    for (const l of input.lines)
      tx.insert(supOrderLines)
        .values({ ...l, orderId, quantityShipped: 0 })
        .run();
  });
}

/** The supplier orders in `status`, each once, oldest id first (SWHR2-R-0141). */
export function listSupplierOrders(status: string): { orderId: string; status: string }[] {
  return db
    .select({ orderId: supOrders.orderId, status: supOrders.status })
    .from(supOrders)
    .where(eq(supOrders.status, status))
    .orderBy(supOrders.orderId)
    .all();
}
