import { HTTPError, defineHandler } from "nitro/h3";

import { getItem } from "../../../../services/catalog";
import { requestLocale } from "../../../../services/locale";

export default defineHandler(async (event) => {
  const itemId = (event.context.params as { itemId?: string } | undefined)?.itemId ?? "";
  const item = await getItem(itemId, requestLocale(event));
  if (!item) throw new HTTPError({ status: 404, message: "Item not found" });
  return item;
});
