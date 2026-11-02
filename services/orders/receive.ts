import { eq } from "drizzle-orm";

import { db } from "../../db/client";
import { opPoCards, opPoContacts, opPoLineItems, opPurchaseOrders } from "../../db/schema";
import { fromXml } from "../documents/purchase-order";
import type { Party, PurchaseOrder } from "../documents/purchase-order";
import type { Executor } from "../ids";
import { autoApproves } from "./approval";
import { applyDecision } from "./decide";
import { startWorkflow } from "./workflow";

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
  return readPurchaseOrder(db, orderId);
}

/** `getPurchaseOrder` for a caller that is inside a transaction and cannot await. */
export function readPurchaseOrder(exec: Executor, orderId: string): PurchaseOrder | undefined {
  const header = exec
    .select()
    .from(opPurchaseOrders)
    .where(eq(opPurchaseOrders.orderId, orderId))
    .get();
  if (!header) return undefined;
  const contact = exec.select().from(opPoContacts).where(eq(opPoContacts.orderId, orderId)).get();
  const card = exec.select().from(opPoCards).where(eq(opPoCards.orderId, orderId)).get();
  const lines = exec
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

/** A new order as order processing is handed it; money is in display units (499.99). */
export interface OrderDoc {
  orderId: string;
  locale: string;
  totalPrice: number;
  userId?: string;
  email?: string;
  orderDate?: number;
  billing?: Party;
  shipping?: Party;
  card?: PurchaseOrder["card"];
  lines: {
    itemId: string;
    lineNumber: number;
    quantity: number;
    unitPrice: number;
    categoryId?: string;
    productId?: string;
  }[];
}

const NO_PARTY: Party = {
  givenName: "",
  familyName: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  phone: "",
  email: "",
};

const hundredths = (amount: number): number => Math.round(amount * 100);

/**
 * Receipt step, inside the caller's transaction: stores the order, starts its workflow as PENDING
 * and only then asks the rule whether it approves itself, applying the same decision as an
 * administrator when it does (design.md P2).
 */
export function receivePurchaseOrder(tx: Executor, po: PurchaseOrder): void {
  insertOrder(tx, po);
  startWorkflow(tx, po.orderId, "PENDING");
  if (autoApproves(po.locale, po.total)) applyDecision(tx, po.orderId, "APPROVED");
}

/** The `order.new` channel handler: decodes the order document and runs the receipt step. */
export function receiveOrderMessage(tx: Executor, payload: string): void {
  receivePurchaseOrder(tx, fromXml(payload));
}

/** Order processing's receipt of one order document, in one transaction (SWHR2-R-0085). */
export async function receiveOrder(doc: OrderDoc): Promise<void> {
  const po: PurchaseOrder = {
    orderId: doc.orderId,
    userId: doc.userId ?? "",
    email: doc.email ?? doc.billing?.email ?? "",
    locale: doc.locale,
    orderDate: doc.orderDate ?? Date.now(),
    total: hundredths(doc.totalPrice),
    billing: doc.billing ?? NO_PARTY,
    shipping: doc.shipping ?? NO_PARTY,
    card: doc.card ?? { cardNumber: "", cardType: "", expiryDate: "" },
    lines: doc.lines.map((l) => ({
      lineNumber: l.lineNumber,
      categoryId: l.categoryId ?? "",
      productId: l.productId ?? "",
      itemId: l.itemId,
      quantity: l.quantity,
      unitPrice: hundredths(l.unitPrice),
    })),
  };
  db.transaction((tx) => receivePurchaseOrder(tx, po));
}
