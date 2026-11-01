import { HTTPError, defineHandler, readBody } from "nitro/h3";

import { cartFor, lines, total, updateQuantities } from "../../../services/cart";
import { guardRoute } from "../../../services/errors";
import { requestLocale } from "../../../services/locale";
import { sessionOf } from "../../../services/session/store";

/** Update Cart: sets each submitted quantity; a value that is not a number counts as 0, as in the legacy form. */
export default defineHandler((event) =>
  guardRoute(async () => {
    const body = (await readBody(event)) as { quantities?: unknown } | undefined;
    const q = body?.quantities;
    if (typeof q !== "object" || q === null || Array.isArray(q))
      throw new HTTPError({ status: 400, message: "quantities required" });
    const cart = cartFor(sessionOf(event).id);
    updateQuantities(
      cart,
      Object.fromEntries(
        Object.entries(q).map(([id, v]) => [
          id,
          typeof v === "number" && Number.isInteger(v) ? v : 0,
        ]),
      ),
    );
    const locale = requestLocale(event);
    const view = await lines(cart, locale);
    return { locale, lines: view, total: total(view) };
  }),
);
