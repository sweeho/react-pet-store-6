import { defineHandler } from "nitro/h3";

import { customerView } from "../../../services/customers/http";
import { requireCustomer } from "../../../services/session/guards";

export default defineHandler(async (event) => {
  const userId = requireCustomer(event);
  const customer = await customerView(userId);
  return { userId, ...(customer && { customer }) };
});
