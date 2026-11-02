import { definePlugin } from "nitro";

import { startWorker } from "../services/messages";
import { receiveOrder } from "../services/orders/receive";

// Order processing runs in this process: it consumes the `order.new` channel (design.md P2).
// Not started under Vitest, so tests see the order left pending on the channel.
export default definePlugin(() => {
  if (process.env.VITEST) return;
  const key = "__orderWorkerStarted";
  const g = globalThis as Record<string, unknown>;
  if (g[key]) return;
  g[key] = true;
  startWorker({ "order.new": receiveOrder });
});
