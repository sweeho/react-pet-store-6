import { asc, eq } from "drizzle-orm";

import { db } from "../../db/client";
import { poCards, poContacts, poLineItems, purchaseOrders } from "../../db/schema";
import { fromXml } from "../documents/purchase-order";
import type { Contact, PurchaseOrder } from "../documents/purchase-order";

export type { PurchaseOrder } from "../documents/purchase-order";

/** `db` or a transaction on it. */
type Unit = Pick<typeof db, "transaction">;

/**
 * Stores the header, one contact (the shipping information), one card and the lines together.
 * Throws, keeping nothing, on a duplicate order id or any record that cannot be created.
 */
export function createPurchaseOrder(unit: Unit, po: PurchaseOrder): void {
  unit.transaction((tx) => {
    const b = po.billing;
    tx.insert(purchaseOrders)
      .values({
        orderId: po.orderId,
        userId: po.userId,
        email: po.email,
        orderDate: po.orderDate,
        locale: po.locale,
        total: po.total,
        billGivenName: b.givenName,
        billFamilyName: b.familyName,
        billStreet: b.street,
        billStreet2: b.street2 ?? "",
        billCity: b.city,
        billState: b.state,
        billZip: b.zip,
        billCountry: b.country,
        billPhone: b.phone,
        billEmail: b.email,
      })
      .run();
    const s = po.shipping;
    tx.insert(poContacts)
      .values({ orderId: po.orderId, ...s, street2: s.street2 ?? "" })
      .run();
    tx.insert(poCards)
      .values({ orderId: po.orderId, ...po.card })
      .run();
    // A line's shipped quantity always starts at 0, whatever the document says.
    for (const l of po.lines)
      tx.insert(poLineItems)
        .values({ orderId: po.orderId, ...l, quantityShipped: 0 })
        .run();
  });
}

/** The stored purchase order with this id, or undefined. */
export function getPurchaseOrder(orderId: string): PurchaseOrder | undefined {
  const h = db.select().from(purchaseOrders).where(eq(purchaseOrders.orderId, orderId)).get();
  if (!h) return undefined;
  const c = db.select().from(poContacts).where(eq(poContacts.orderId, orderId)).get();
  const card = db.select().from(poCards).where(eq(poCards.orderId, orderId)).get();
  if (!c || !card) return undefined;
  const lines = db
    .select()
    .from(poLineItems)
    .where(eq(poLineItems.orderId, orderId))
    .orderBy(asc(poLineItems.lineNumber))
    .all();
  const contact = (x: Contact & { street2?: string }): Contact => ({
    givenName: x.givenName,
    familyName: x.familyName,
    street: x.street,
    ...(x.street2 && { street2: x.street2 }),
    city: x.city,
    state: x.state,
    country: x.country,
    zip: x.zip,
    email: x.email,
    phone: x.phone,
  });
  return {
    orderId: h.orderId,
    userId: h.userId,
    email: h.email,
    locale: h.locale,
    orderDate: h.orderDate,
    total: h.total,
    billing: contact({
      givenName: h.billGivenName,
      familyName: h.billFamilyName,
      street: h.billStreet,
      street2: h.billStreet2,
      city: h.billCity,
      state: h.billState,
      country: h.billCountry,
      zip: h.billZip,
      email: h.billEmail,
      phone: h.billPhone,
    }),
    shipping: contact(c),
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

/** Receipt of an `order.new` message: decode the document, then store the order it describes. */
export function receiveOrderDocument(xml: string): void {
  createPurchaseOrder(db, fromXml(xml));
}
