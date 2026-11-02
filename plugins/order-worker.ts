import { definePlugin } from "nitro";

import { startWorker } from "../services/messaging/worker";

// Order processing and the supplier run in this process: the worker consumes the `order.*` and `supplier.*`
// channels, each delivery in one transaction (design.md P1). Not started under Vitest, so tests see messages left pending.
export default definePlugin(() => {
  if (process.env.VITEST) return;
  const key = "__orderWorkerStarted";
  const g = globalThis as Record<string, unknown>;
  if (g[key]) return;
  g[key] = true;
  startWorker();
});
