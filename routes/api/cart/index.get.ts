import { defineHandler } from "nitro/h3";

import { cartFor, lines, total } from "../../../services/cart";
import { guardRoute } from "../../../services/errors";
import { requestLocale } from "../../../services/locale";
import { sessionOf } from "../../../services/session/store";

export default defineHandler((event) =>
  guardRoute(async () => {
    const locale = requestLocale(event);
    const view = await lines(cartFor(sessionOf(event).id), locale);
    return { locale, lines: view, total: total(view) };
  }),
);
