import { HTTPError, defineHandler, readBody } from "nitro/h3";

import { cartFor, updateQuantities, view } from "../../../services/cart";
import { requestLocale } from "../../../services/locale";

export default defineHandler(async (event) => {
  const { session } = event.context as { session?: { id: string } };
  const body = (await readBody(event)) as { quantities?: unknown } | undefined;
  const q = body?.quantities;
  if (!q || typeof q !== "object" || Object.values(q).some((n) => typeof n !== "number"))
    throw new HTTPError({ status: 400, message: "quantities required" });
  const cart = cartFor(session?.id ?? "anonymous");
  updateQuantities(cart, q as Record<string, number>);
  return view(cart, requestLocale(event));
});
