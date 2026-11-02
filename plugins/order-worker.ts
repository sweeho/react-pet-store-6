import { definePlugin } from "nitro";

import { startWorker } from "../services/messaging/worker";

// Order processing runs in this process: it consumes the `order.new` and `order.approval`
// channels (design.md P1). Not started under Vitest, so tests see messages left pending.
export default definePlugin(() => {
  if (process.env.VITEST) return;
  const key = "__orderWorkerStarted";
  const g = globalThis as Record<string, unknown>;
  if (g[key]) return;
  g[key] = true;
  startWorker();
});
