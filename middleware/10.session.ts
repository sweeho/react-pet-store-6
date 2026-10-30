import { defineHandler } from "nitro/h3";

import { attachSession } from "../services/session/store";

export type { Session } from "../services/session/store";

export default defineHandler((event) => {
  attachSession(event);
});
