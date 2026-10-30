import { defineHandler, setCookie } from "nitro/h3";

import { verifyCustomer } from "../../../services/session/auth";
import { readCredentials, rejected } from "../../../services/session/http";
import { renewSession } from "../../../services/session/store";

const REMEMBER_SECONDS = 31 * 24 * 60 * 60;

export default defineHandler(async (event) => {
  const { userId, password, remember } = await readCredentials(event);
  if (!(await verifyCustomer(userId, password))) rejected();
  renewSession(event, userId);
  // Written only after the credential check, so a failed sign-in never changes the remembered name.
  setCookie(event, "remembered_username", remember ? userId : "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: remember ? REMEMBER_SECONDS : 0,
  });
  return { userId };
});
