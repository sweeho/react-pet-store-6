import { XMLParser } from "fast-xml-parser";

import { documentHead } from "./catalog";
import { toDate } from "./supplier-order";

export interface InvoiceInput {
  orderId?: string;
  userId?: string;
  shippingDate?: string;
  lines: { lineNumber: number; itemId: string; quantity: number }[];
}

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** The shipment invoice: order id, user id, shipping date and the shipped lines. A missing id or date fails. */
export function buildInvoice(input: InvoiceInput): string {
  if (!input.orderId) throw new Error("An order id is required.");
  if (input.userId == null) throw new Error("A user id is required.");
  if (!input.shippingDate) throw new Error("A shipping date is required.");
  const { prolog, rootAttrs } = documentHead("Invoice");
  const lines = input.lines
    .map(
      (l) =>
        `<LineItem lineNumber="${esc(l.lineNumber)}" itemId="${esc(l.itemId)}" quantity="${esc(l.quantity)}"></LineItem>`,
    )
    .join("");
  return `${prolog}<Invoice${rootAttrs}><OrderId>${esc(input.orderId)}</OrderId><UserId>${esc(input.userId)}</UserId><ShippingDate>${toDate(input.shippingDate)}</ShippingDate>${lines}</Invoice>`;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: false,
  parseAttributeValue: false,
  isArray: (name) => name === "LineItem",
});

/** Reads an invoice; a document whose root is not `Invoice` is rejected (SWHR2-R-0092). */
export function readInvoiceDocument(xml: string): Required<InvoiceInput> {
  const root = (parser.parse(xml) as { Invoice?: Record<string, unknown> }).Invoice;
  if (!root || typeof root !== "object") throw new Error("Invoice element expected.");
  const text = (k: string) => (typeof root[k] === "string" ? (root[k] as string) : "");
  const orderId = text("OrderId");
  if (!orderId) throw new Error("Invoice needs an OrderId.");
  return {
    orderId,
    userId: text("UserId"),
    shippingDate: text("ShippingDate"),
    lines: ((root.LineItem ?? []) as Record<string, string>[]).map((l) => ({
      lineNumber: Number(l["@_lineNumber"]),
      itemId: String(l["@_itemId"]),
      quantity: Number(l["@_quantity"]),
    })),
  };
}
