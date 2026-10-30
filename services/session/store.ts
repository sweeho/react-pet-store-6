import type { H3Event } from "nitro/h3";
import { getCookie, setCookie } from "nitro/h3";

import { DEFAULT_LOCALE } from "../../shared/i18n/locale";
import { discardCart, moveCart } from "../cart";

export type Area = "storefront" | "admin" | "supplier";

export interface Session {
  id: string;
  area: Area;
  locale: string;
  userId?: string;
  lastSeen: number;
}

const MINUTE = 60 * 1000;
// Storefront 15 min (SWHR2-R-0120), administration 54 min (SWHR2-R-0032).
// No supplier limit is specified (design.md SD8): supplier sessions end at sign-out or restart.
const IDLE_LIMIT: Record<Area, number> = {
  storefront: 15 * MINUTE,
  admin: 54 * MINUTE,
  supplier: Number.POSITIVE_INFINITY,
};

export const COOKIE: Record<Area, string> = {
  storefront: "ps_sid",
  admin: "admin_sid",
  supplier: "supplier_sid",
};

// In-memory and server-owned: sessions are never persisted to SQLite (design.md, Data).
const sessions = new Map<string, Session>();

export function areaOf(pathname: string): Area {
  if (pathname === "/api/admin" || pathname.startsWith("/api/admin/")) return "admin";
  if (pathname === "/api/supplier" || pathname.startsWith("/api/supplier/")) return "supplier";
  return "storefront";
}

function setSessionCookie(event: H3Event, area: Area, value: string | null) {
  const name = COOKIE[area];
  // A request can start and then renew its session; keep only the last cookie for the name.
  const others = event.res.headers.getSetCookie().filter((c) => !c.startsWith(`${name}=`));
  event.res.headers.delete("set-cookie");
  for (const c of others) event.res.headers.append("set-cookie", c);
  setCookie(event, name, value ?? "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: event.url.protocol === "https:",
    ...(value === null ? { maxAge: 0 } : {}),
  });
}

function start(event: H3Event, area: Area, locale: string, userId?: string): Session {
  const session: Session = { id: crypto.randomUUID(), area, locale, userId, lastSeen: Date.now() };
  sessions.set(session.id, session);
  setSessionCookie(event, area, session.id);
  event.context.session = session;
  return session;
}

/** Drops a session and everything it owned, the cart included. */
function end(session: Session) {
  sessions.delete(session.id);
  discardCart(session.id);
}

/** Attaches the request's session for the area its path belongs to, dropping one past its idle limit. */
export function attachSession(event: H3Event): Session {
  const area = areaOf(event.url.pathname);
  const id = getCookie(event, COOKIE[area]);
  const found = id ? sessions.get(id) : undefined;
  const now = Date.now();
  if (found && found.area === area && now - found.lastSeen <= IDLE_LIMIT[area]) {
    found.lastSeen = now;
    event.context.session = found;
    return found;
  }
  if (found) end(found);
  return start(event, area, found?.locale ?? DEFAULT_LOCALE);
}

export function sessionOf(event: H3Event): Session {
  return event.context.session as Session;
}

/** Gives the request a new session id (design D6) that keeps the locale and the cart. */
export function renewSession(event: H3Event, userId: string): Session {
  const old = sessionOf(event);
  sessions.delete(old.id);
  const next = start(event, old.area, old.locale, userId);
  moveCart(old.id, next.id);
  return next;
}

/** Ends the request's session. The storefront starts a fresh one that keeps the locale. */
export function signOut(event: H3Event): void {
  const old = sessionOf(event);
  end(old);
  if (old.area === "storefront") start(event, old.area, old.locale);
  else setSessionCookie(event, old.area, null);
}

/** True when `id` names a live, signed-on session of `area`. */
export function isSignedOn(id: string | undefined, area: Area): boolean {
  const s = id ? sessions.get(id) : undefined;
  return (
    s !== undefined &&
    s.area === area &&
    s.userId !== undefined &&
    Date.now() - s.lastSeen <= IDLE_LIMIT[area]
  );
}
