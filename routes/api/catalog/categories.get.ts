import { defineHandler } from "nitro/h3";

import { listCategories } from "../../../services/catalog";
import { catalogResponse, intParam } from "../../../services/catalog/http";
import { requestLocale } from "../../../services/locale";

export default defineHandler((event) =>
  catalogResponse(() =>
    listCategories(requestLocale(event), intParam(event, "start"), intParam(event, "size")),
  ),
);
