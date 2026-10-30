import { defineHandler } from "nitro/h3";

import { requireCustomer } from "../../../services/session/guards";

export default defineHandler((event) => ({ userId: requireCustomer(event) }));
