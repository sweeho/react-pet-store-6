import { asc, eq } from "drizzle-orm";
import { defineHandler, getQuery, HTTPError } from "nitro/h3";

import { db } from "../../../../db/client";
import { opOrderWorkflow, opPurchaseOrders } from "../../../../db/schema";
import { guardRoute } from "../../../../services/errors";
import { requireAdmin } from "../../../../services/session/guards";

/** `M/D/YYYY` in UTC. */
const mdy = (ms: number) => {
  const d = new Date(ms);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
};

/** The orders whose workflow status equals `status` exactly, by order id, as a bare array. Rows carry both the tool's and the table's field names. */
export default defineHandler((event) =>
  guardRoute(() => {
    requireAdmin(event);
    const status = getQuery(event).status;
    if (typeof status !== "string" || status === "")
      throw new HTTPError({
        status: 400,
        message: "Status is required",
        data: { kind: "InvalidStatus" },
      });
    return db
      .select({
        orderId: opPurchaseOrders.orderId,
        userId: opPurchaseOrders.userId,
        locale: opPurchaseOrders.locale,
        orderDate: opPurchaseOrders.orderDate,
        total: opPurchaseOrders.total,
        status: opOrderWorkflow.status,
      })
      .from(opOrderWorkflow)
      .innerJoin(opPurchaseOrders, eq(opPurchaseOrders.orderId, opOrderWorkflow.orderId))
      .where(eq(opOrderWorkflow.status, status))
      .orderBy(asc(opPurchaseOrders.orderId))
      .all()
      .map((o) => ({
        id: o.orderId,
        orderId: o.orderId,
        userId: o.userId,
        locale: o.locale,
        date: mdy(o.orderDate),
        amount: o.total / 100,
        totalPrice: o.total / 100,
        status: o.status,
      }));
  }),
);
