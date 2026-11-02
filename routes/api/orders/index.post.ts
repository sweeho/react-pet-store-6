import { defineHandler, HTTPError } from "nitro/h3";

import { guardRoute } from "../../../services/errors";
import { requestLocale } from "../../../services/locale";
import { missingFields, placeOrder } from "../../../services/orders/place";
import type { PartyInput } from "../../../services/orders/place";
import { requireCustomer } from "../../../services/session/guards";
import { sessionOf } from "../../../services/session/store";
import { readJson } from "../../../services/customers/http";

const obj = (v: unknown): Partial<Record<keyof PartyInput, unknown>> =>
  v && typeof v === "object" ? (v as Partial<Record<keyof PartyInput, unknown>>) : {};

/** Places the signed-on customer's order from the submitted billing and shipping details. */
export default defineHandler((event) =>
  guardRoute(async () => {
    const userId = requireCustomer(event);
    const body = await readJson(event);
    const billing = obj(body.billing);
    const shipping = obj(body.shipping);
    const session = sessionOf(event);
    return placeOrder({
      sessionId: session.id,
      userId,
      locale: requestLocale(event),
      billing: billing as unknown as PartyInput,
      shipping: shipping as unknown as PartyInput,
      validate: () => {
        const missing = [
          ...missingFields(billing).map((f) => `billing ${f}`),
          ...missingFields(shipping).map((f) => `shipping ${f}`),
        ];
        if (missing.length)
          throw new HTTPError({
            status: 400,
            message: `Missing: ${missing.join(", ")}`,
            data: { kind: "InvalidOrder" },
          });
      },
    });
  }),
);
