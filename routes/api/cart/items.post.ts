import { HTTPError, defineHandler, readBody } from "nitro/h3";

import { addItem, addItemWithQuantity, cartFor, lines, total } from "../../../services/cart";
import { guardRoute } from "../../../services/errors";
import { requestLocale } from "../../../services/locale";
import { sessionOf } from "../../../services/session/store";

export default defineHandler((event) =>
  guardRoute(async () => {
    const body = (await readBody(event)) as { itemId?: unknown; quantity?: unknown } | undefined;
    if (typeof body?.itemId !== "string" || !body.itemId)
      throw new HTTPError({ status: 400, message: "itemId required" });
    const cart = cartFor(sessionOf(event).id);
    if (typeof body.quantity === "number") addItemWithQuantity(cart, body.itemId, body.quantity);
    else addItem(cart, body.itemId);
    const locale = requestLocale(event);
    const view = await lines(cart, locale);
    return { locale, lines: view, total: total(view) };
  }),
);
