import type { H3Event } from "nitro/h3";
import { getQuery } from "nitro/h3";

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, parseLocale } from "../shared/i18n/locale";

function valid(code: unknown): string | undefined {
  if (typeof code !== "string") return undefined;
  const parsed = parseLocale(code);
  return parsed && (SUPPORTED_LOCALES as readonly string[]).includes(parsed.code)
    ? parsed.code
    : undefined;
}

/** Valid `locale` query parameter, else the session locale, else en_US. */
export function requestLocale(event: H3Event): string {
  const session = (event.context as { session?: { locale?: string } }).session;
  return valid(getQuery(event).locale) ?? session?.locale ?? DEFAULT_LOCALE;
}
