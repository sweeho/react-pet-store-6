import { defineHandler } from "nitro/h3";

import { sessionOf, signOut } from "../../../services/session/store";

export default defineHandler((event) => {
  const { locale } = sessionOf(event);
  signOut(event);
  return { locale };
});
