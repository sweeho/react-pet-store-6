import { defineHandler } from "nitro/h3";

import { requireSupplier } from "../../../services/session/guards";

export default defineHandler((event) => ({ userId: requireSupplier(event) }));
