import { defineHandler } from "nitro/h3";

import { updateCustomer } from "../../../services/customers";
import {
  customerView,
  mapCustomerError,
  readChanges,
  readJson,
} from "../../../services/customers/http";
import { requireCustomer } from "../../../services/session/guards";

export default defineHandler(async (event) => {
  const userId = requireCustomer(event);
  await updateCustomer(userId, readChanges(await readJson(event))).catch(mapCustomerError);
  return { userId, customer: await customerView(userId) };
});
