import { defineHandler } from "nitro/h3";

import { guardRoute } from "../../../services/errors";
import { requireSupplier } from "../../../services/session/guards";
import { listInventory } from "../../../services/supplier/inventory";

export default defineHandler((event) =>
  guardRoute(() => {
    requireSupplier(event);
    return listInventory();
  }),
);
