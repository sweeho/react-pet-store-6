import { HTTPError, defineHandler, readBody } from "nitro/h3";

import { db } from "../../../db/client";
import { cartFor, clearCart, lines, total } from "../../../services/cart";
import type { Contact } from "../../../services/documents/purchase-order";
import { toXml } from "../../../services/documents/purchase-order";
import { EmptyCartOrder, guardRoute } from "../../../services/errors";
import { nextId } from "../../../services/ids";
import { requestLocale } from "../../../services/locale";
import { ORDER_NEW, enqueue } from "../../../services/messaging/enqueue";
import { ORDER_ID_PREFIX, orderLines, prefill } from "../../../services/orders/checkout";
import { requireCustomer } from "../../../services/session/guards";
import { sessionOf } from "../../../services/session/store";

const REQUIRED = [
  "givenName",
  "familyName",
  "street",
  "city",
  "state",
  "zip",
  "country",
  "email",
  "phone",
] as const;

/** A submitted contact with every value trimmed; a missing required value is a 400. */
function readContact(v: unknown, side: string): Contact {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const get = (k: string) => (typeof o[k] === "string" ? o[k].trim() : "");
  for (const k of REQUIRED)
    if (!get(k))
      throw new HTTPError({
        status: 400,
        message: `${side} ${k} required`,
        data: { kind: "InvalidOrder" },
      });
  const street2 = get("street2");
  return {
    givenName: get("givenName"),
    familyName: get("familyName"),
    street: get("street"),
    ...(street2 && { street2 }),
    city: get("city"),
    state: get("state"),
    country: get("country"),
    zip: get("zip"),
    email: get("email"),
    phone: get("phone"),
  };
}

export default defineHandler((event) =>
  guardRoute(async () => {
    const userId = requireCustomer(event);
    const session = sessionOf(event);
    const locale = requestLocale(event);
    const view = await lines(cartFor(session.id), locale);
    if (view.length === 0) throw new EmptyCartOrder("The shopping cart is empty.");
    const body = (await readBody(event).catch(() => undefined)) as
      | { billing?: unknown; shipping?: unknown }
      | undefined;
    const billing = readContact(body?.billing, "billing");
    const shipping = readContact(body?.shipping, "shipping");
    const { card } = await prefill(userId);

    // The id and the queued order document commit together; the worker stores the order later.
    const orderId = db.transaction((tx) => {
      const id = nextId(ORDER_ID_PREFIX, tx);
      enqueue(
        tx,
        ORDER_NEW,
        toXml({
          orderId: id,
          userId,
          email: billing.email,
          locale,
          orderDate: Date.now(),
          total: total(view),
          billing,
          shipping,
          card,
          lines: orderLines(view),
        }),
      );
      return id;
    });
    clearCart(session.id);
    return { orderId };
  }),
);
