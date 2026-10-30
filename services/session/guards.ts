import type { H3Event } from "nitro/h3";
import { HTTPError } from "nitro/h3";

import type { Area } from "./store";
import { sessionOf } from "./store";

function requireArea(event: H3Event, area: Area): string {
  const session = sessionOf(event);
  if (session.area !== area || !session.userId)
    throw new HTTPError({
      status: 401,
      message: "Sign-on required",
      data: { kind: "SignOnRequired" },
    });
  return session.userId;
}

/** The signed-on customer's user id, or 401 SignOnRequired (the SPA sends the visitor to sign in). */
export const requireCustomer = (event: H3Event) => requireArea(event, "storefront");
export const requireAdmin = (event: H3Event) => requireArea(event, "admin");
export const requireSupplier = (event: H3Event) => requireArea(event, "supplier");
