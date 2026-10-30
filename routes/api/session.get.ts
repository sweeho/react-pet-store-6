import { defineHandler, getCookie } from "nitro/h3";

import { requestLocale } from "../../services/locale";
import { sessionOf } from "../../services/session/store";

export default defineHandler((event) => {
  const { userId } = sessionOf(event);
  const rememberedUserName = getCookie(event, "remembered_username");
  return {
    locale: requestLocale(event),
    signedOn: userId !== undefined,
    ...(userId !== undefined && { userId }),
    ...(rememberedUserName && { rememberedUserName }),
  };
});
