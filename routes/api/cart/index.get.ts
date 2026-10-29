import { defineHandler } from "nitro/h3";

import { cartFor, lines } from "../../../services/cart";
import { requestLocale } from "../../../services/locale";

export default defineHandler(async (event) => {
  const { session } = event.context as { session?: { id: string } };
  const locale = requestLocale(event);
  return { locale, lines: await lines(cartFor(session?.id ?? "anonymous"), locale) };
});
