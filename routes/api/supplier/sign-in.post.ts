import { HTTPError, defineHandler, getCookie } from "nitro/h3";

import { verifySupplier } from "../../../services/session/auth";
import { readCredentials, rejected } from "../../../services/session/http";
import { COOKIE, isSignedOn, renewSession } from "../../../services/session/store";

export default defineHandler(async (event) => {
  // The supplier area is refused while the request carries a live administration session.
  if (isSignedOn(getCookie(event, COOKIE.admin), "admin"))
    throw new HTTPError({
      status: 409,
      message: "Sign out of administration first",
      data: { kind: "AdminSignedIn" },
    });
  const { userId, password } = await readCredentials(event);
  if (!(await verifySupplier(userId, password))) rejected();
  renewSession(event, userId);
  return { userId };
});
