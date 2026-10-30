import { defineHandler } from "nitro/h3";

import { signOut } from "../../../services/session/store";

export default defineHandler((event) => {
  signOut(event);
  return {};
});
