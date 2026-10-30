import { HTTPError, defineHandler } from "nitro/h3";

import { cartFor, removeItem } from "../../../../services/cart";

export default defineHandler((event) => {
  const { session } = event.context as { session?: { id: string } };
  const itemId = (event.context.params as { itemId?: string } | undefined)?.itemId;
  if (!itemId) throw new HTTPError({ status: 400, message: "itemId required" });
  const cart = cartFor(session?.id ?? "anonymous");
  removeItem(cart, itemId);
  return { count: cart.size };
});
