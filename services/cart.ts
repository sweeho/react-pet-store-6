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

export function addItem(cart: Map<string, number>, itemId: string): void {
  cart.set(itemId, 1);
}

/** Replaces the line's quantity with `qty`, as supplied and unvalidated. */
export function addItemWithQuantity(cart: Map<string, number>, itemId: string, qty: number): void {
  cart.set(itemId, qty);
}

/** Drops the whole line; a no-op when the item is not in the cart. */
export function removeItem(cart: Map<string, number>, itemId: string): void {
  cart.delete(itemId);
}

/** Sets each given quantity. */
export function updateQuantities(
  cart: Map<string, number>,
  quantities: Record<string, number>,
): void {
  for (const [itemId, qty] of Object.entries(quantities)) cart.set(itemId, qty);
}

export function clear(cart: Map<string, number>): void {
  cart.clear();
}

/** Σ unit price × quantity, in integer hundredths. */
export function totalOf(cartLines: CartLine[]): number {
  return cartLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

export async function cartTotal(cart: Map<string, number>, locale?: string): Promise<number> {
  return totalOf(await lines(cart, locale));
}

/** The cart as every cart route returns it. */
export async function cartView(cart: Map<string, number>, locale: string) {
  const cartLines = await lines(cart, locale);
  return { locale, lines: cartLines, total: totalOf(cartLines) };
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
