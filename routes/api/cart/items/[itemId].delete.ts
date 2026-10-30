import { defineHandler } from "nitro/h3";

import { cartFor, removeItem, view } from "../../../../services/cart";
import { requestLocale } from "../../../../services/locale";

export default defineHandler(async (event) => {
  const { session } = event.context as { session?: { id: string } };
  const cart = cartFor(session?.id ?? "anonymous");
  removeItem(cart, event.context.params?.itemId ?? "");
  return view(cart, requestLocale(event));
});
