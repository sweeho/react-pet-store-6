import { HTTPError, defineHandler } from "nitro/h3";

import { cartFor, cartView, removeItem } from "../../../../services/cart";
import { requestLocale } from "../../../../services/locale";

export default defineHandler(async (event) => {
  const { session } = event.context as { session?: { id: string } };
  const itemId = (event.context.params as { itemId?: string } | undefined)?.itemId;
  if (!itemId) throw new HTTPError({ status: 400, message: "itemId required" });
  const cart = cartFor(session?.id ?? "anonymous");
  removeItem(cart, itemId);
  return cartView(cart, requestLocale(event));
});
