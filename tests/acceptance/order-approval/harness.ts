import { vi } from "vitest";

import { ADMIN, call, cookieValue, loadApp } from "../sign-on/harness";

export { call, cookieValue };

/** Order document handed to order processing. Money is in display units (499.99, 49999). */
export interface OrderDoc {
  orderId: string;
  locale: string;
  total: number;
}

export async function loadOrders() {
  const app = await loadApp();
  return { ...app, receive: () => import("../../../services/orders/receive") };
}

/**
 * Delivers one order to order processing through services/orders/receive.ts
 * (assumed `receiveOrder(doc)`), with one line item that sums to the total.
 */
export async function deliver(doc: OrderDoc) {
  const { receiveOrder } = await import("../../../services/orders/receive");
  await receiveOrder({
    orderId: doc.orderId,
    locale: doc.locale,
    totalPrice: doc.total,
    lines: [{ itemId: "EST-1", lineNumber: 1, quantity: 1, unitPrice: doc.total }],
  });
}

export const statusOf = (client: import("bun:sqlite").Database, orderId: string) =>
  (
    client.query("select status from op_order_workflow where order_id = ?").get(orderId) as
      | { status: string }
      | undefined
  )?.status;

export const messagesOn = (client: import("bun:sqlite").Database, channel: string) =>
  client.query("select * from messages where channel = ?").all(channel) as {
    payload: string;
    status: string;
  }[];

/** Signs in as administrator and returns the cookie bag for later calls. */
export async function adminCookies(app: Awaited<ReturnType<typeof loadApp>>) {
  const r = await call(app, "../../../routes/api/admin/sign-in.post", {
    method: "POST",
    url: "/api/admin/sign-in",
    json: ADMIN,
  });
  return { admin_sid: cookieValue(r.setCookies, "admin_sid") ?? "" };
}

export { vi };
