import { defineHandler, HTTPError } from "nitro/h3";

import { db } from "../../../../db/client";
import { guardRoute } from "../../../../services/errors";
import { readJson } from "../../../../services/customers/http";
import { enqueue } from "../../../../services/messaging";
import { ORDER_APPROVAL_CHANNEL, toApprovalXml } from "../../../../services/orders/decide";
import type { DecisionEntry } from "../../../../services/orders/decide";
import { requireAdmin } from "../../../../services/session/guards";

const bad = () =>
  new HTTPError({ status: 400, message: "Invalid decisions", data: { kind: "InvalidDecisions" } });

/** Enqueues the administrator's decisions as one approval document and returns without waiting. */
export default defineHandler((event) =>
  guardRoute(async () => {
    requireAdmin(event);
    const body = await readJson(event);
    const raw = body.decisions;
    if (!Array.isArray(raw) || raw.length === 0) throw bad();
    const entries: DecisionEntry[] = raw.map((d: unknown) => {
      const e = d as Partial<DecisionEntry> | null;
      if (!e || typeof e.orderId !== "string" || !e.orderId || typeof e.status !== "string")
        throw bad();
      return { orderId: e.orderId, status: e.status };
    });
    const xml = toApprovalXml(entries);
    db.transaction((tx) => enqueue(tx, ORDER_APPROVAL_CHANNEL, xml));
    event.res.status = 202;
    return {};
  }),
);
