import { defineHandler } from "nitro/h3";

import { requireAdmin } from "../../../services/session/guards";

export default defineHandler((event) => ({ userId: requireAdmin(event) }));
