import { XMLParser } from "fast-xml-parser";

import { documentHead } from "./catalog";

export interface SupplierOrderInput {
  orderId?: string;
  userId?: string;
  /** An ISO date or date-time; only the date part is written. */
  orderDate?: string;
  shipping: Record<string, string | undefined>;
  lines: {
    lineNumber: number;
    categoryId: string;
    productId: string;
    itemId: string;
    quantity: number;
    /** Hundredths. */
    unitPrice: number;
  }[];
}

/** Shipping address elements in document order, with the input key each is read from. */
const ADDRESS: [element: string, key: string][] = [
  ["FirstName", "firstName"],
  ["LastName", "lastName"],
  ["Street", "street"],
  ["City", "city"],
  ["State", "state"],
  ["Country", "country"],
  ["ZipCode", "zip"],
  ["Email", "email"],
  ["Phone", "phone"],
];
const LINE_ATTRS = ["lineNumber", "categoryId", "productId", "itemId", "quantity", "unitPrice"];

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** `YYYY-MM-DD` of an ISO date or date-time, without a time of day (SWHR2-R-0137). */
export function toDate(value: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  if (!m) throw new Error(`Date "${value}" is not a year-month-day date.`);
  return m[1];
}

/**
 * Builds the supplier order document. An order id, user id or date that is missing fails; a missing
 * address field is written empty (SWHR2-R-0094, SWHR2-R-0138).
 */
export function buildSupplierOrder(input: SupplierOrderInput): string {
  if (!input.orderId) throw new Error("An order id is required.");
  if (input.userId == null) throw new Error("A user id is required.");
  if (!input.orderDate) throw new Error("An order date is required.");
  const { prolog, rootAttrs } = documentHead("SupplierOrder");
  const address = ADDRESS.map(([el, k]) => `<${el}>${esc(input.shipping[k])}</${el}>`).join("");
  const lines = input.lines
    .map(
      (l) =>
        `<LineItem lineNumber="${esc(l.lineNumber)}" categoryId="${esc(l.categoryId)}" productId="${esc(l.productId)}" itemId="${esc(l.itemId)}" quantity="${esc(l.quantity)}" unitPrice="${(l.unitPrice / 100).toFixed(2)}"></LineItem>`,
    )
    .join("");
  return `${prolog}<SupplierOrder${rootAttrs} userId="${esc(input.userId)}"><OrderId>${esc(input.orderId)}</OrderId><OrderDate>${toDate(input.orderDate)}</OrderDate><ShippingAddress>${address}</ShippingAddress>${lines}</SupplierOrder>`;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: false,
  isArray: (name) => name === "LineItem",
});

type Node = Record<string, unknown>;
const parse = (xml: string): Node | undefined =>
  (parser.parse(xml) as { SupplierOrder?: Node }).SupplierOrder;

/** Reads a supplier order document back into its input shape. */
export function readSupplierOrder(xml: string): SupplierOrderInput {
  const root = parse(xml);
  if (!root || typeof root !== "object") throw new Error("SupplierOrder element expected.");
  const addr = (root.ShippingAddress ?? {}) as Node;
  const text = (n: Node, k: string) => (typeof n[k] === "string" ? (n[k] as string) : "");
  return {
    orderId: text(root, "OrderId"),
    userId: String(root["@_userId"] ?? ""),
    orderDate: text(root, "OrderDate"),
    shipping: Object.fromEntries(ADDRESS.map(([el, k]) => [k, text(addr, el)])),
    lines: ((root.LineItem ?? []) as Node[]).map((l) => ({
      lineNumber: Number(l["@_lineNumber"]),
      categoryId: String(l["@_categoryId"]),
      productId: String(l["@_productId"]),
      itemId: String(l["@_itemId"]),
      quantity: Number(l["@_quantity"]),
      unitPrice: Math.round(Number(l["@_unitPrice"]) * 100),
    })),
  };
}

/**
 * A structural check of the document's content model: the elements in order, a nine-field address
 * and one or more line items with all six attributes (SWHR2-R-0138.02, design SD3).
 */
export function validateSupplierOrder(xml: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  let root: Node | undefined;
  try {
    root = parse(xml);
  } catch (e) {
    return { valid: false, errors: [e instanceof Error ? e.message : String(e)] };
  }
  if (!root || typeof root !== "object")
    return { valid: false, errors: ["SupplierOrder element expected."] };
  const inOrder = (n: Node, want: string[], where: string) => {
    const got = Object.keys(n).filter((k) => !k.startsWith("@_"));
    let at = -1;
    for (const w of want) {
      const i = got.indexOf(w);
      if (i < 0) errors.push(`${where} needs ${w}.`);
      else if (i < at) errors.push(`${w} is out of order in ${where}.`);
      else at = i;
    }
  };
  inOrder(root, ["OrderId", "OrderDate", "ShippingAddress", "LineItem"], "SupplierOrder");
  if (root.ShippingAddress && typeof root.ShippingAddress === "object")
    inOrder(
      root.ShippingAddress as Node,
      ADDRESS.map(([el]) => el),
      "ShippingAddress",
    );
  for (const l of (root.LineItem ?? []) as Node[])
    for (const a of LINE_ATTRS) if (l[`@_${a}`] === undefined) errors.push(`LineItem needs ${a}.`);
  return { valid: errors.length === 0, errors };
}
