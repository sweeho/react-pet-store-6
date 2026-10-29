import { defineHandler } from "nitro/h3";

import { listItems } from "../../../../../services/catalog";
import { catalogResponse, pathParam } from "../../../../../services/catalog/http";
import { requestLocale } from "../../../../../services/locale";

export default defineHandler((event) =>
  catalogResponse(() => listItems(pathParam(event, "productId"), requestLocale(event))),
);
