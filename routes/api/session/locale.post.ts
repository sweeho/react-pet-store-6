import { HTTPError, defineHandler, readBody } from "nitro/h3";

import { parseLocale } from "../../../shared/i18n/locale";

export default defineHandler(async (event) => {
  const body = await readBody<{ locale?: unknown }>(event);
  const parsed = typeof body?.locale === "string" ? parseLocale(body.locale) : null;
  if (!parsed) throw new HTTPError({ status: 400, message: "Invalid locale code" });
  const session = event.context.session as { locale: string };
  session.locale = parsed.code;
  return { locale: parsed.code };
});
