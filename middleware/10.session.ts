import { defineHandler } from "nitro/h3";

import { SUPPORTED_LOCALES, type SupportedLocale } from "../shared/i18n/locale";
import { attachSession } from "../services/session/store";

export type { Session } from "../services/session/store";

export default defineHandler((event) => {
  const session = attachSession(event);
  // A page link may choose the language (`/?locale=ja_JP`), the same choice the language flags make.
  const requested = event.url.searchParams.get("locale");
  if (
    !event.url.pathname.startsWith("/api/") &&
    SUPPORTED_LOCALES.includes(requested as SupportedLocale)
  ) {
    session.locale = requested as string;
  }
});
