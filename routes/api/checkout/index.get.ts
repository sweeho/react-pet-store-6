import { defineHandler } from "nitro/h3";

import { guardRoute } from "../../../services/errors";
import { prefill } from "../../../services/orders/place";
import { requireCustomer } from "../../../services/session/guards";

/** The billing and shipping form, pre-filled from the signed-on customer's account. */
export default defineHandler((event) => guardRoute(async () => prefill(requireCustomer(event))));
