import { asc, eq } from "drizzle-orm";
import { defineHandler, getQuery, HTTPError } from "nitro/h3";

import { db } from "../../../../db/client";
import { opOrderWorkflow, opPurchaseOrders } from "../../../../db/schema";
import { guardRoute } from "../../../../services/errors";
import { requireAdmin } from "../../../../services/session/guards";

const STATUSES = ["PENDING", "APPROVED", "DENIED", "COMPLETED"];

/** The orders with one workflow status, by order id. Rows carry both the tool's and the table's field names. */
export default defineHandler((event) =>
  guardRoute(() => {
    requireAdmin(event);
    const status = String(getQuery(event).status ?? "");
    if (!STATUSES.includes(status))
      throw new HTTPError({
        status: 400,
        message: "Unknown status",
        data: { kind: "InvalidStatus" },
      });
    const orders = db
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
        date: new Date(o.orderDate).toISOString(),
        amount: o.total / 100,
        totalPrice: o.total / 100,
        status: o.status,
      }));
    return { items: orders, orders };
  }),
);
