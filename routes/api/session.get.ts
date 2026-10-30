import { defineHandler, getCookie } from "nitro/h3";

import { getCustomer } from "../../services/customers";
import { requestLocale } from "../../services/locale";
import { sessionOf } from "../../services/session/store";

export default defineHandler(async (event) => {
  const { userId } = sessionOf(event);
  const rememberedUserName = getCookie(event, "remembered_username");
  const profile = userId === undefined ? undefined : (await getCustomer(userId))?.profile;
  return {
    locale: requestLocale(event),
    signedOn: userId !== undefined,
    ...(userId !== undefined && { userId }),
    ...(profile && {
      preferences: {
        myList: profile.myListOn,
        banner: profile.bannerOn,
        favouriteCategory: profile.favouriteCategory,
      },
    }),
    ...(rememberedUserName && { rememberedUserName }),
  };
});
