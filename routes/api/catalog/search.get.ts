import { getQuery } from "h3";
import { defineHandler } from "nitro/h3";

import { search } from "../../../services/catalog";
import { catalogResponse, intParam } from "../../../services/catalog/http";
import { requestLocale } from "../../../services/locale";

export default defineHandler((event) => {
  const query = getQuery(event);
  const text = [query.q, query.keyword].find((v): v is string => typeof v === "string");
  return catalogResponse(() =>
    search(text ?? "", requestLocale(event), intParam(event, "start"), intParam(event, "size")),
  );
});
