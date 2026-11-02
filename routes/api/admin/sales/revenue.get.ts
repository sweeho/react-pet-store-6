import { defineHandler, getQuery } from "nitro/h3";

import { guardRoute } from "../../../../services/errors";
import { salesByCategory } from "../../../../services/orders/sales";
import { requireAdmin } from "../../../../services/session/guards";

/** revenue per category over orders dated from `start` to `end` (ISO dates). */
export default defineHandler((event) =>
  guardRoute(() => {
    requireAdmin(event);
    const q = getQuery(event);
    return salesByCategory(
      "revenue",
      q.start ? String(q.start) : undefined,
      q.end ? String(q.end) : undefined,
    );
  }),
);
