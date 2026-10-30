import { HTTPError, defineHandler, readBody } from "nitro/h3";

import { cartFor, cartView, updateQuantities } from "../../../services/cart";
import { requestLocale } from "../../../services/locale";

export default defineHandler(async (event) => {
  const { session } = event.context as { session?: { id: string } };
  const body = (await readBody(event)) as { quantities?: unknown } | undefined;
  const q = body?.quantities;
  if (!q || typeof q !== "object" || Array.isArray(q))
    throw new HTTPError({ status: 400, message: "quantities required" });
  const quantities: Record<string, number> = {};
  for (const [id, v] of Object.entries(q)) {
    if (typeof v !== "number" || !Number.isFinite(v))
      throw new HTTPError({ status: 400, message: "quantities must be numbers" });
    quantities[id] = v;
  }
  const cart = cartFor(session?.id ?? "anonymous");
  updateQuantities(cart, quantities);
  return cartView(cart, requestLocale(event));
});
