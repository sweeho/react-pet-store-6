import { eq } from "drizzle-orm";

import { db } from "../../db/client";
import {
  messages,
  opOrderWorkflow,
  opPoCards,
  opPoContacts,
  opPoLineItems,
  opPurchaseOrders,
} from "../../db/schema";
import { fromXml } from "../documents/purchase-order";
import type { Party, PurchaseOrder } from "../documents/purchase-order";
import type { Executor } from "../ids";

function insertOrder(tx: Executor, po: PurchaseOrder): void {
  tx.insert(opPurchaseOrders)
    .values({
      orderId: po.orderId,
      userId: po.userId,
      locale: po.locale,
      orderDate: po.orderDate,
      total: po.total,
      ...po.billing,
      email: po.email,
    })
    .run();
  // The one contact record is built from the shipping information (SWHR2-R-0004).
  tx.insert(opPoContacts)
    .values({ orderId: po.orderId, ...po.shipping })
    .run();
  tx.insert(opPoCards)
    .values({ orderId: po.orderId, ...po.card })
    .run();
  if (po.lines.length > 0)
    tx.insert(opPoLineItems)
      .values(po.lines.map((l) => ({ ...l, orderId: po.orderId, quantityShipped: 0 })))
      .run();
}

/**
 * Stores the order header, its shipping contact, card and lines together, or none of them
 * (SWHR2-R-0004). An order id that is already stored is refused and the stored order is unchanged
 * (SWHR2-R-0052). Joins the caller's transaction when given one.
 */
export async function createPurchaseOrder(exec: Executor, po: PurchaseOrder): Promise<void> {
  exec.transaction((tx) => insertOrder(tx, po));
}

/** The stored purchase order with this id, or undefined. */
export async function getPurchaseOrder(orderId: string): Promise<PurchaseOrder | undefined> {
  const header = db
    .select()
    .from(opPurchaseOrders)
    .where(eq(opPurchaseOrders.orderId, orderId))
    .get();
  if (!header) return undefined;
  const contact = db.select().from(opPoContacts).where(eq(opPoContacts.orderId, orderId)).get();
  const card = db.select().from(opPoCards).where(eq(opPoCards.orderId, orderId)).get();
  const lines = db
    .select()
    .from(opPoLineItems)
    .where(eq(opPoLineItems.orderId, orderId))
    .orderBy(opPoLineItems.lineNumber)
    .all();
  if (!contact || !card) return undefined;
  const party = (p: Party): Party => ({
    givenName: p.givenName,
    familyName: p.familyName,
    street: p.street,
    city: p.city,
    state: p.state,
    zip: p.zip,
    country: p.country,
    phone: p.phone,
    email: p.email,
  });
  return {
    orderId: header.orderId,
    userId: header.userId,
    email: header.email,
    locale: header.locale,
    orderDate: header.orderDate,
    total: header.total,
    billing: party(header),
    shipping: party(contact),
    card: { cardNumber: card.cardNumber, cardType: card.cardType, expiryDate: card.expiryDate },
    lines: lines.map((l) => ({
      lineNumber: l.lineNumber,
      categoryId: l.categoryId,
      productId: l.productId,
      itemId: l.itemId,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
    })),
  };
}

/**
 * Order processing's handler for one `order.new` message: decodes the document, stores the order,
 * starts its workflow as PENDING and marks the message done, in one transaction.
 */
export async function receiveOrder(messageId: number | object): Promise<void> {
  if (typeof messageId !== "number") throw new Error("VortexNotImplemented");
  const message = db.select().from(messages).where(eq(messages.id, messageId)).get();
  if (!message || message.status !== "pending") return;
  const po = fromXml(message.payload);
  db.transaction((tx) => {
    insertOrder(tx, po);
    tx.insert(opOrderWorkflow).values({ orderId: po.orderId, status: "PENDING" }).run();
    tx.update(messages).set({ status: "done" }).where(eq(messages.id, messageId)).run();
  });
}
