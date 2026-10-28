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
  cart.set(itemId, (cart.get(itemId) ?? 0) + 1);
}

/** Cart lines with name, attribute and price from the cart locale's catalog details (en_US when none). */
export function lines(cart: Map<string, number>, locale?: string): CartLine[] {
  const loc = locale ?? DEFAULT_LOCALE;
  const out: CartLine[] = [];
  for (const [itemId, quantity] of cart) {
    const item = getItem(itemId, loc);
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
