import { defineHandler } from "nitro/h3";

import { verifyAdmin } from "../../../services/session/auth";
import { readCredentials, rejected } from "../../../services/session/http";
import { renewSession } from "../../../services/session/store";

export default defineHandler(async (event) => {
  const { userId, password } = await readCredentials(event);
  if (!(await verifyAdmin(userId, password))) rejected();
  renewSession(event, userId);
  return { userId };
});
