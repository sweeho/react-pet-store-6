/* eslint-disable @typescript-eslint/no-explicit-any --
   The fulfilment modules are not built yet and design.md names only some of their functions, so
   the tests reach them through loosely typed module handles. Every guessed name is used here. */
import type { Database } from "bun:sqlite";

import { loadApp } from "../sign-on/harness";
import { purchaseOrder } from "../checkout/harness";

export { loadApp, purchaseOrder };
export type Mod = Record<string, any>;

export const mod = async (path: string): Promise<Mod> =>
  (await import(/* @vite-ignore */ path)) as Mod;

export const count = (client: Database, table: string, where = "1=1") =>
  (client.query(`select count(*) n from ${table} where ${where}`).get() as { n: number }).n;
export const statusOf = (client: Database, orderId: string) =>
  (client.query("select status from op_order_workflow where order_id = ?").get(orderId) as any)
    ?.status as string | undefined;
export const messages = (client: Database, channel: string, like = "%") =>
  client
    .query("select * from messages where channel = ? and payload like ?")
    .all(channel, like) as {
    subscriber: string | null;
    status: string;
    attempts: number;
    payload: string;
  }[];

/** App plus the modules the fulfilment tests drive. */
export async function fulfilment() {
  const app = await loadApp();
  const messaging = await mod("../../../services/messaging");
  const worker = await mod("../../../services/messaging/worker");
  const receive = await mod("../../../services/orders/receive");
  const workflow = await mod("../../../services/orders/workflow");
  const decide = await mod("../../../services/orders/decide");
  const invoices = await mod("../../../services/orders/invoice");
  const supplier = await mod("../../../services/supplier/orders");
  const fulfil = await mod("../../../services/supplier/fulfil");
  const docs = await mod("../../../services/documents/supplier-order");
  const invoiceDocs = await mod("../../../services/documents/invoice");
  const { db, client } = app;
  /** Processes every due message, including the ones that processing creates. */
  const drain = async () => {
    for (let i = 0; i < 10; i++) {
      client.exec("update messages set available_at = 0 where status = 'pending'");
      if (!(await worker.processDue())) break;
    }
  };
  const setStock = (itemId: string, quantity: number) =>
    client.exec(
      `insert or replace into sup_inventory (item_id, quantity) values ('${itemId}', ${quantity})`,
    );
  const stock = (itemId: string) =>
    (client.query("select quantity q from sup_inventory where item_id = ?").get(itemId) as any)
      ?.q as number;
  /** An order processing already approved: stored purchase order plus an APPROVED workflow record. */
  const approvedOrder = async (orderId: string, lines: [string, number][]) => {
    const po = purchaseOrder(orderId, lines);
    await receive.createPurchaseOrder(db, po);
    client.exec(
      `insert into op_order_workflow (order_id, status) values ('${orderId}', 'APPROVED')`,
    );
    return po;
  };
  const invoiceFor = (orderId: string, lines: [string, number][]) =>
    invoiceDocs.buildInvoice({
      orderId,
      userId: "j2ee",
      shippingDate: "2003-04-15",
      lines: lines.map(([itemId, quantity], i) => ({ lineNumber: i + 1, itemId, quantity })),
    });
  return {
    ...app,
    messaging,
    worker,
    receive,
    workflow,
    decide,
    invoices,
    supplier,
    fulfil,
    docs,
    invoiceDocs,
    drain,
    setStock,
    stock,
    approvedOrder,
    invoiceFor,
  };
}

export const approvalXml = (orderId: string, status: string) =>
  `<OrderApproval><Order><OrderId>${orderId}</OrderId><OrderStatus>${status}</OrderStatus></Order></OrderApproval>`;

/** Input of a supplier order: the shape both the document builder and the supplier order step take. */
export function supplierOrder(
  orderId: string | undefined,
  lines: [string, number][] = [["EST-1", 3]],
  overrides: Record<string, unknown> = {},
) {
  return {
    orderId,
    userId: "j2ee",
    orderDate: "2003-04-15T14:32:00",
    shipping: {
      firstName: "ABC",
      lastName: "XYZ",
      street: "1 Main St",
      city: "Palo Alto",
      state: "CA",
      country: "USA",
      zip: "94303",
      email: "abc@xyz.com",
      phone: "555-555-5555",
    },
    lines: lines.map(([itemId, quantity], i) => ({
      lineNumber: i + 1,
      categoryId: "FISH",
      productId: "FI-SW-01",
      itemId,
      quantity,
      unitPrice: 1650,
    })),
    ...overrides,
  };
}

/** Fails any insert into `messages` for `channel`, via a SQLite trigger. */
export function failPublishing(client: Database, channel: string) {
  client.exec(
    `create trigger fail_${channel.replace(/\W/g, "_")} before insert on messages when new.channel = '${channel}' begin select raise(abort, 'injected failure'); end`,
  );
}
export const dropFailure = (client: Database, channel: string) =>
  client.exec(`drop trigger fail_${channel.replace(/\W/g, "_")}`);
