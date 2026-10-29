import { defineHandler } from "nitro/h3";

import { getCategory } from "../../../../services/catalog";
import { catalogResponse, notFound, pathParam } from "../../../../services/catalog/http";
import { requestLocale } from "../../../../services/locale";

export default defineHandler((event) =>
  catalogResponse(async () => {
    const category = await getCategory(pathParam(event, "categoryId"), requestLocale(event));
    return category ?? notFound("Category");
  }),
);
