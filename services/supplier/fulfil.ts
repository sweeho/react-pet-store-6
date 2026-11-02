import { and, eq } from "drizzle-orm";

import { supOrderLines, supOrders } from "../../db/schema";
import { readSupplierOrder, validateSupplierOrder } from "../documents/supplier-order";
import { buildInvoice } from "../documents/invoice";
import type { Executor } from "../ids";
import { enqueue } from "../messaging";
import { createSupplierOrder, listSupplierOrders } from "./orders";
import { reduceStock } from "./inventory";

export const INVOICE_CHANNEL = "supplier.invoice";

/**
 * Ships every unshipped line the stock covers whole, records it, and publishes one invoice for the
 * shipment. The order is COMPLETED when every line is shipped. Runs in the caller's transaction, so
 * a failed publish records nothing and consumes no stock (SWHR2-R-0095, SWHR2-R-0100).
 */
export function fulfilOrder(tx: Executor, orderId: string): void {
  const order = tx.select().from(supOrders).where(eq(supOrders.orderId, orderId)).get();
  if (!order || order.status !== "PENDING") return;
  const lines = tx
    .select()
    .from(supOrderLines)
    .where(eq(supOrderLines.orderId, orderId))
    .orderBy(supOrderLines.lineNumber)
    .all();
  const shipped: { lineNumber: number; itemId: string; quantity: number }[] = [];
  for (const l of lines) {
    if (l.quantityShipped >= l.quantity) continue;
    if (!reduceStock(tx, l.itemId, l.quantity - l.quantityShipped)) continue;
    tx.update(supOrderLines)
      .set({ quantityShipped: l.quantity })
      .where(and(eq(supOrderLines.orderId, orderId), eq(supOrderLines.lineNumber, l.lineNumber)))
      .run();
    shipped.push({
      lineNumber: l.lineNumber,
      itemId: l.itemId,
      quantity: l.quantity - l.quantityShipped,
    });
  }
  if (shipped.length === 0) return;
  enqueue(
    tx,
    INVOICE_CHANNEL,
    buildInvoice({
      orderId,
      userId: order.userId,
      shippingDate: new Date().toISOString(),
      lines: shipped,
    }),
  );
  const now = new Set(shipped.map((l) => l.lineNumber));
  if (lines.every((l) => l.quantityShipped >= l.quantity || now.has(l.lineNumber)))
    tx.update(supOrders).set({ status: "COMPLETED" }).where(eq(supOrders.orderId, orderId)).run();
}

/**
 * The `supplier.purchase-order` handler: validates the document, records the supplier order and
 * fulfils it, all in the delivery transaction (SWHR2-R-0097, SWHR2-R-0095).
 */
export function receiveSupplierPurchaseOrder(tx: Executor, xml: string): void {
  const check = validateSupplierOrder(xml);
  if (!check.valid) throw new Error(`Supplier order rejected: ${check.errors.join(" ")}`);
  const input = readSupplierOrder(xml);
  createSupplierOrder(tx, input);
  fulfilOrder(tx, input.orderId ?? "");
}

/**
 * The `supplier.inventory-changed` handler: fulfils every PENDING supplier order again. The
 * invoices it publishes are how order processing learns of the restock (design SD7).
 */
export function refulfil(tx: Executor): void {
  for (const { orderId } of listSupplierOrders("PENDING")) fulfilOrder(tx, orderId);
}
