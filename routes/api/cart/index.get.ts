import { defineHandler } from "nitro/h3";

import { cartFor, cartView } from "../../../services/cart";
import { requestLocale } from "../../../services/locale";

export default defineHandler(async (event) => {
  const { session } = event.context as { session?: { id: string } };
  return cartView(cartFor(session?.id ?? "anonymous"), requestLocale(event));
});
