import { defineHandler } from "nitro/h3";

import { cartFor, lines, removeItem, total } from "../../../../services/cart";
import { guardRoute } from "../../../../services/errors";
import { requestLocale } from "../../../../services/locale";
import { sessionOf } from "../../../../services/session/store";

export default defineHandler((event) =>
  guardRoute(async () => {
    const itemId = (event.context.params as { itemId?: string } | undefined)?.itemId ?? "";
    const cart = cartFor(sessionOf(event).id);
    removeItem(cart, itemId);
    const locale = requestLocale(event);
    const view = await lines(cart, locale);
    return { locale, lines: view, total: total(view) };
  }),
);
