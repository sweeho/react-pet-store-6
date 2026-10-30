import { DEFAULT_LOCALE } from "../shared/i18n/locale";
import { getItem } from "./catalog";

export interface CartLine {
  itemId: string;
  quantity: number;
  name: string;
  attribute: string;
  unitPrice: number;
}

// In-memory and server-owned, keyed by session id, like the session itself.
const carts = new Map<string, Map<string, number>>();

export function cartFor(sessionId: string): Map<string, number> {
  let cart = carts.get(sessionId);
  if (!cart) carts.set(sessionId, (cart = new Map()));
  return cart;
}

/** Adds one of the item; an item already in the cart goes back to quantity 1. */
export function addItem(cart: Map<string, number>, itemId: string): void {
  cart.set(itemId, 1);
}

/** Sets the item's quantity as supplied, replacing any existing one. The quantity is not validated. */
export function addItemWithQuantity(
  cart: Map<string, number>,
  itemId: string,
  quantity: number,
): void {
  cart.set(itemId, quantity);
}

/** Removes the whole line whatever its quantity; an item not in the cart is left alone. */
export function removeItem(cart: Map<string, number>, itemId: string): void {
  cart.delete(itemId);
}

/** Cart lines with name, attribute and price from the cart locale's catalog details (en_US when none). */
export async function lines(cart: Map<string, number>, locale?: string): Promise<CartLine[]> {
  const loc = locale ?? DEFAULT_LOCALE;
  const out: CartLine[] = [];
  for (const [itemId, quantity] of cart) {
    const item = await getItem(itemId, loc);
    if (item)
      out.push({
        itemId,
        quantity,
        name: item.description,
        attribute: item.attributes[0] ?? "",
        unitPrice: item.listPrice,
      });
  }
  return out;
}

/** Empties and forgets the cart of an ended session. */
export function discardCart(sessionId: string): void {
  carts.delete(sessionId);
}

/** Keeps a cart across a session id renewal. */
export function moveCart(from: string, to: string): void {
  const cart = carts.get(from);
  if (!cart) return;
  carts.delete(from);
  carts.set(to, cart);
}
