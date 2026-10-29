import { defineHandler } from "nitro/h3";

import { listProducts } from "../../../../../services/catalog";
import { catalogResponse, intParam, pathParam } from "../../../../../services/catalog/http";
import { requestLocale } from "../../../../../services/locale";

export default defineHandler((event) =>
  catalogResponse(() =>
    listProducts(
      pathParam(event, "categoryId"),
      requestLocale(event),
      intParam(event, "start"),
      intParam(event, "size"),
    ),
  ),
);
