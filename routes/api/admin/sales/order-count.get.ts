import { defineHandler, getQuery } from "nitro/h3";

import { guardRoute } from "../../../../services/errors";
import { salesByCategory } from "../../../../services/orders/sales";
import { requireAdmin } from "../../../../services/session/guards";

/** order-count per category over orders dated from `start` to `end` (ISO dates). */
export default defineHandler((event) =>
  guardRoute(() => {
    requireAdmin(event);
    const q = getQuery(event);
    return salesByCategory(
      "count",
      q.start ? String(q.start) : undefined,
      q.end ? String(q.end) : undefined,
    );
  }),
);
