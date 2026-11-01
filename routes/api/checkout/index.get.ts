import { defineHandler } from "nitro/h3";

import { cartFor, lines, total } from "../../../services/cart";
import { guardRoute } from "../../../services/errors";
import { requestLocale } from "../../../services/locale";
import { prefill } from "../../../services/orders/checkout";
import { requireCustomer } from "../../../services/session/guards";
import { sessionOf } from "../../../services/session/store";

export default defineHandler((event) =>
  guardRoute(async () => {
    const userId = requireCustomer(event);
    const locale = requestLocale(event);
    const { contact } = await prefill(userId);
    const view = await lines(cartFor(sessionOf(event).id), locale);
    return { locale, billing: contact, shipping: contact, lines: view, total: total(view) };
  }),
);
