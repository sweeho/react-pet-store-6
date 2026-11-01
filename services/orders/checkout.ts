import { eq } from "drizzle-orm";

import { db } from "../../db/client";
import { catalogItems, catalogProducts } from "../../db/schema";
import { getCustomer } from "../customers";
import type { Contact, OrderLine } from "../documents/purchase-order";
import type { CartLine } from "../cart";

/** Storefront order ids come from the "1001" sequence. */
export const ORDER_ID_PREFIX = "1001";

/** The card shown on an order when the customer has no account card (legacy demo card). */
const DEMO_CARD = {
  cardNumber: "4111111111111111",
  cardType: "Java(TM) Card",
  expiryDate: "12/2005",
};

const BLANK: Contact = {
  givenName: "",
  familyName: "",
  street: "",
  city: "",
  state: "",
  country: "",
  zip: "",
  email: "",
  phone: "",
};

/** The signed-on customer's account contact, in the names an order uses (design.md SD5). */
export async function prefill(
  userId: string,
): Promise<{ contact: Contact; card: typeof DEMO_CARD }> {
  const customer = await getCustomer(userId);
  if (!customer) return { contact: { ...BLANK }, card: DEMO_CARD };
  const c = customer.account.contact;
  const k = customer.account.card;
  return {
    contact: {
      givenName: c.givenName,
      familyName: c.familyName,
      street: c.address.street1,
      ...(c.address.street2 && { street2: c.address.street2 }),
      city: c.address.city,
      state: c.address.state,
      country: c.address.country,
      zip: c.address.zip,
      email: c.email,
      phone: c.telephone,
    },
    card: {
      cardNumber: k.cardNumber,
      cardType: k.cardType,
      expiryDate: `${String(k.expiryMonth).padStart(2, "0")}/${k.expiryYear}`,
    },
  };
}

/** Order lines in cart order, numbered from 0. */
export function orderLines(view: CartLine[]): OrderLine[] {
  return view.map((l, i) => {
    const ids = db
      .select({ productId: catalogItems.productId, categoryId: catalogProducts.categoryId })
      .from(catalogItems)
      .innerJoin(catalogProducts, eq(catalogProducts.productId, catalogItems.productId))
      .where(eq(catalogItems.itemId, l.itemId))
      .get();
    return {
      lineNumber: i,
      categoryId: ids?.categoryId ?? "",
      productId: ids?.productId ?? "",
      itemId: l.itemId,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
    };
  });
}
