import { defineHandler } from "nitro/h3";

import { listProducts } from "../../../services/catalog";
import { getCustomer } from "../../../services/customers";
import { requestLocale } from "../../../services/locale";
import { requireCustomer } from "../../../services/session/guards";

const SIZE = 10;

/** The first products of the favourite category, or nothing while MyList is off. */
export default defineHandler(async (event) => {
  const userId = requireCustomer(event);
  const profile = (await getCustomer(userId))?.profile;
  if (!profile?.myListOn || !profile.favouriteCategory) return { items: [] };
  const page = await listProducts(profile.favouriteCategory, requestLocale(event), 0, SIZE);
  return { items: page.items.map(({ productId, name }) => ({ productId, name })) };
});
