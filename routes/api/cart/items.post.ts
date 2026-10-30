import { HTTPError, defineHandler, readBody } from "nitro/h3";

import { addItem, addItemWithQuantity, cartFor } from "../../../services/cart";

export default defineHandler(async (event) => {
  const { session } = event.context as { session?: { id: string } };
  const body = (await readBody(event)) as { itemId?: unknown; quantity?: unknown } | undefined;
  if (typeof body?.itemId !== "string" || !body.itemId)
    throw new HTTPError({ status: 400, message: "itemId required" });
  const cart = cartFor(session?.id ?? "anonymous");
  if (body.quantity === undefined || body.quantity === null) addItem(cart, body.itemId);
  else addItemWithQuantity(cart, body.itemId, Number(body.quantity));
  return { count: cart.size };
});
