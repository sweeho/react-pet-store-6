import { HTTPError, defineHandler, readBody } from "nitro/h3";

import { addItemWithQuantity, cartFor, removeItem } from "../../../services/cart";

/** Update Cart: each quantity replaces the line's old one; a quantity below 1 drops the line. */
export default defineHandler(async (event) => {
  const { session } = event.context as { session?: { id: string } };
  const body = (await readBody(event)) as { quantities?: Record<string, unknown> } | undefined;
  if (!body?.quantities || typeof body.quantities !== "object")
    throw new HTTPError({ status: 400, message: "quantities required" });
  const cart = cartFor(session?.id ?? "anonymous");
  for (const [itemId, raw] of Object.entries(body.quantities)) {
    if (!cart.has(itemId)) continue;
    const quantity = Math.trunc(Number(raw));
    if (!Number.isFinite(quantity)) continue;
    if (quantity < 1) removeItem(cart, itemId);
    else addItemWithQuantity(cart, itemId, quantity);
  }
  return { count: cart.size };
});
