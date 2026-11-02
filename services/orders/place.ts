import { eq } from "drizzle-orm";

import { db } from "../../db/client";
import { catalogProducts } from "../../db/schema";
import { cartFor, clearCart, lines } from "../cart";
import type { Party, PurchaseOrder } from "../documents/purchase-order";
import { toXml } from "../documents/purchase-order";
import { getItem } from "../catalog";
import { getCustomer } from "../customers";
import { EmptyCartOrder } from "../errors";
import { nextId } from "../ids";
import { enqueue } from "../messaging";

/** The id sequence orders draw from (SWHR2-R-0006). */
export const ORDER_ID_PREFIX = "1001";
export const ORDER_NEW_CHANNEL = "order.new";

/** A checkout form block: a contact with its address; `street2` is the optional second address line. */
export interface PartyInput extends Party {
  street2?: string;
}

const REQUIRED: (keyof Party)[] = [
  "givenName",
  "familyName",
  "street",
  "city",
  "state",
  "zip",
  "country",
  "phone",
  "email",
];

/** Billing and shipping details from the signed-on customer's account, for the checkout form. */
export async function prefill(
  userId: string,
): Promise<{ billing: PartyInput; shipping: PartyInput }> {
  const customer = await getCustomer(userId);
  const c = customer?.account.contact;
  const party: PartyInput = {
    givenName: c?.givenName ?? "",
    familyName: c?.familyName ?? "",
    street: c?.address.street1 ?? "",
    street2: c?.address.street2 ?? "",
    city: c?.address.city ?? "",
    state: c?.address.state ?? "",
    zip: c?.address.zip ?? "",
    country: c?.address.country ?? "",
    phone: c?.telephone ?? "",
    email: c?.email ?? "",
  };
  return { billing: { ...party }, shipping: { ...party } };
}

/** The form block as a document party: the second address line joins the street. */
export function toParty(input: PartyInput): Party {
  const { street2, ...party } = input;
  return street2 ? { ...party, street: `${party.street}, ${street2}` } : party;
}

/** Names of the required fields of a form block that are missing or blank. */
export function missingFields(input: Partial<Record<keyof PartyInput, unknown>>): string[] {
  return REQUIRED.filter((k) => typeof input[k] !== "string" || input[k].trim() === "");
}

/**
 * Places the order of a signed-on customer's cart: takes the next id, enqueues the order document
 * on `order.new` in one transaction, then empties the cart. The request does not wait for approval
 * (SWHR2-R-0049). An empty cart is refused first.
 */
export async function placeOrder(input: {
  sessionId: string;
  userId: string;
  locale: string;
  billing: PartyInput;
  shipping: PartyInput;
  /** Rejects a form that is not complete; runs after the empty-cart check. */
  validate: () => void;
}): Promise<{ orderId: string }> {
  const cart = cartFor(input.sessionId);
  const view = await lines(cart, input.locale);
  if (view.length === 0) throw new EmptyCartOrder("Your shopping cart is empty.");
  input.validate();

  const customer = await getCustomer(input.userId);
  const card = customer?.account.card;
  const billing = toParty(input.billing);
  const poLines = await Promise.all(
    view.map(async (l, i) => {
      const productId = (await getItem(l.itemId, input.locale))?.productId ?? "";
      const product = db
        .select({ categoryId: catalogProducts.categoryId })
        .from(catalogProducts)
        .where(eq(catalogProducts.productId, productId))
        .get();
      return {
        lineNumber: i + 1,
        categoryId: product?.categoryId ?? "",
        productId,
        itemId: l.itemId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      };
    }),
  );
  const orderId = db.transaction((tx) => {
    const id = nextId(ORDER_ID_PREFIX, tx);
    const po: PurchaseOrder = {
      orderId: id,
      userId: input.userId,
      email: billing.email,
      locale: input.locale,
      orderDate: Date.now(),
      total: view.reduce((sum, l) => sum + l.lineTotal, 0),
      billing,
      shipping: toParty(input.shipping),
      // The account's card is stored on the order and never charged (design.md SD7).
      card: card
        ? {
            cardNumber: card.cardNumber,
            cardType: card.cardType,
            expiryDate: `${String(card.expiryMonth).padStart(2, "0")}/${card.expiryYear}`,
          }
        : { cardNumber: "", cardType: "", expiryDate: "" },
      lines: poLines,
    };
    enqueue(tx, ORDER_NEW_CHANNEL, toXml(po));
    return id;
  });
  clearCart(input.sessionId);
  return { orderId };
}
