import { definePlugin } from "nitro";

import { ORDER_NEW } from "../services/messaging/enqueue";
import { deliverPending } from "../services/messaging/deliver";
import { receiveOrderDocument } from "../services/orders/receive";

const POLL_MS = 1000;

// The in-process consumer: starts with the Nitro server, so route tests (which never load plugins)
// see queued messages stay pending.
export default definePlugin(() => {
  setInterval(() => {
    try {
      deliverPending({ [ORDER_NEW]: receiveOrderDocument });
    } catch (e) {
      console.error("message worker:", e);
    }
  }, POLL_MS).unref();
});
