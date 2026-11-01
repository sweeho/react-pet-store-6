import { defineHandler } from "nitro/h3";

import { getItem } from "../../../../services/catalog";
import { ItemNotFound, guardRoute } from "../../../../services/errors";
import { requestLocale } from "../../../../services/locale";

export default defineHandler((event) =>
  guardRoute(async () => {
    const itemId = (event.context.params as { itemId?: string } | undefined)?.itemId ?? "";
    const item = await getItem(itemId, requestLocale(event));
    if (!item) throw new ItemNotFound("Item not found");
    return item;
  }),
);
