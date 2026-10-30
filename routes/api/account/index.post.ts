import { defineHandler } from "nitro/h3";

import { createCustomer } from "../../../services/customers";
import {
  customerView,
  mapCustomerError,
  readJson,
  readNewAccount,
} from "../../../services/customers/http";
import { requireCustomer } from "../../../services/session/guards";

export default defineHandler(async (event) => {
  const userId = requireCustomer(event);
  const { account, profile } = readNewAccount(await readJson(event));
  await createCustomer(userId, account, profile).catch(mapCustomerError);
  event.res.status = 201;
  return { userId, customer: await customerView(userId) };
});
