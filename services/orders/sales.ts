import { and, eq, gte, lt, sql } from "drizzle-orm";

import { db } from "../../db/client";
import { catalogCategoryDetails, opPoLineItems, opPurchaseOrders } from "../../db/schema";

export interface SalesPoint {
  key: string;
  label: string;
  value: number;
}

const DAY_MS = 86_400_000;

/** `YYYY-MM-DD` (or any Date-parsable text) to epoch ms, or undefined. */
function at(text: string | undefined): number | undefined {
  const t = text ? Date.parse(text) : NaN;
  return Number.isNaN(t) ? undefined : t;
}

/** Revenue or order count per product category over orders dated from `start` to `end` inclusive. */
export function salesByCategory(
  kind: "revenue" | "count",
  start: string | undefined,
  end: string | undefined,
): SalesPoint[] {
  const from = at(start) ?? 0;
  const to = (at(end) ?? Number.MAX_SAFE_INTEGER - DAY_MS) + DAY_MS;
  const value =
    kind === "revenue"
      ? sql<number>`sum(${opPoLineItems.quantity} * ${opPoLineItems.unitPrice}) / 100.0`
      : sql<number>`count(distinct ${opPoLineItems.orderId})`;
  const rows = db
    .select({ key: opPoLineItems.categoryId, label: catalogCategoryDetails.name, value })
    .from(opPoLineItems)
    .innerJoin(opPurchaseOrders, eq(opPurchaseOrders.orderId, opPoLineItems.orderId))
    .leftJoin(
      catalogCategoryDetails,
      and(
        eq(catalogCategoryDetails.categoryId, opPoLineItems.categoryId),
        eq(catalogCategoryDetails.locale, "en_US"),
      ),
    )
    .where(and(gte(opPurchaseOrders.orderDate, from), lt(opPurchaseOrders.orderDate, to)))
    .groupBy(opPoLineItems.categoryId)
    .all();
  return rows.map((r) => ({ key: r.key, label: r.label ?? r.key, value: Number(r.value) }));
}
