import { defineHandler } from "nitro/h3";

import { getProduct } from "../../../../services/catalog";
import { catalogResponse, notFound, pathParam } from "../../../../services/catalog/http";
import { requestLocale } from "../../../../services/locale";

export default defineHandler((event) =>
  catalogResponse(async () => {
    const product = await getProduct(pathParam(event, "productId"), requestLocale(event));
    return product ?? notFound("Product");
  }),
);
