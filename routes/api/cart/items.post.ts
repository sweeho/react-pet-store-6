import { HTTPError, defineHandler, readBody } from "nitro/h3";

import { addItem, addItemWithQuantity, cartFor, view } from "../../../services/cart";
import { requestLocale } from "../../../services/locale";

export default defineHandler(async (event) => {
  const { session } = event.context as { session?: { id: string } };
  const body = (await readBody(event)) as { itemId?: unknown; quantity?: unknown } | undefined;
  if (typeof body?.itemId !== "string" || !body.itemId)
    throw new HTTPError({ status: 400, message: "itemId required" });
  const cart = cartFor(session?.id ?? "anonymous");
  if (typeof body.quantity === "number") addItemWithQuantity(cart, body.itemId, body.quantity);
  else addItem(cart, body.itemId);
  return view(cart, requestLocale(event));
});
