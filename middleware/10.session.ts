import { defineHandler, getCookie, setCookie } from "nitro/h3";

import { DEFAULT_LOCALE } from "../shared/i18n/locale";

export interface Session {
  id: string;
  locale: string;
}

// In-memory and server-owned: the session is not persisted to SQLite (design.md, Data).
const sessions = new Map<string, Session>();
const COOKIE = "sid";

export default defineHandler((event) => {
  const existing = getCookie(event, COOKIE);
  let session = existing ? sessions.get(existing) : undefined;
  if (!session) {
    session = { id: crypto.randomUUID(), locale: DEFAULT_LOCALE };
    sessions.set(session.id, session);
    setCookie(event, COOKIE, session.id, { httpOnly: true, sameSite: "lax", path: "/" });
  }
  event.context.session = session;
});
