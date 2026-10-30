import { defineHandler, HTTPError } from "nitro/h3";

import { registerUser } from "../../../services/customers";
import { readJson } from "../../../services/customers/http";
import { renewSession } from "../../../services/session/store";

const MAX_USER_ID = 25;

/** Stand-alone new-user submission. The two passwords are not compared (SWHR2-R-0009.03). */
export default defineHandler(async (event) => {
  const body = await readJson(event);
  const { userId, password, passwordRepeat } = body;
  const blank = (v: unknown) => typeof v !== "string" || v.trim() === "";
  if (blank(userId) || blank(password) || blank(passwordRepeat))
    throw new HTTPError({ status: 400, message: "User name and both passwords are required" });
  const id = (userId as string).trim();
  if (id.length > MAX_USER_ID || /[%*]/.test(id))
    throw new HTTPError({ status: 400, message: "User name is not allowed" });
  await registerUser(id, password as string).catch((e: unknown) => {
    if ((e as { kind?: string }).kind === "UserExists")
      throw new HTTPError({
        status: 409,
        message: "User name in use",
        data: { kind: "UserExists" },
      });
    throw e;
  });
  renewSession(event, id);
  return { userId: id, next: "/petstore/account" };
});
