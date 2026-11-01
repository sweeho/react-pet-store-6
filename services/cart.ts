import { DEFAULT_LOCALE } from "../shared/i18n/locale";
import { getItem } from "./catalog";

export interface CartLine {
  itemId: string;
  quantity: number;
  name: string;
  attribute: string;
  productName: string;
  unitPrice: number;
  lineTotal: number;
}

// In-memory and server-owned, keyed by session id, like the session itself.
const carts = new Map<string, Map<string, number>>();

export function cartFor(sessionId: string): Map<string, number> {
  let cart = carts.get(sessionId);
  if (!cart) carts.set(sessionId, (cart = new Map()));
  return cart;
}

/** Adding sets the line to one unit, as the legacy `cart.put(itemId, 1)` does, even when it is already there. */
export function addItem(cart: Map<string, number>, itemId: string): void {
  cart.set(itemId, 1);
}

/** Replaces any existing quantity; the quantity is not validated (SWHR2-R-0033). */
export function addItemWithQuantity(cart: Map<string, number>, itemId: string, qty: number): void {
  cart.set(itemId, qty);
}

/** Drops the whole line whatever its quantity; absent items are ignored. */
export function removeItem(cart: Map<string, number>, itemId: string): void {
  cart.delete(itemId);
}

/** Sets each given quantity; zero or less removes the line, as the legacy update does. */
export function updateQuantities(
  cart: Map<string, number>,
  quantities: Record<string, number>,
): void {
  for (const [itemId, qty] of Object.entries(quantities)) {
    if (qty > 0) cart.set(itemId, qty);
    else cart.delete(itemId);
  }
}

/** Empties a session's cart once its order is placed. */
export function clearCart(sessionId: string): void {
  carts.get(sessionId)?.clear();
}

export function total(view: CartLine[]): number {
  return view.reduce((sum, l) => sum + l.lineTotal, 0);
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
        productName: item.name,
        unitPrice: item.listPrice,
        lineTotal: item.listPrice * quantity,
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
