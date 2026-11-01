import { XMLParser } from "fast-xml-parser";

export interface Contact {
  givenName: string;
  familyName: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  email: string;
  phone: string;
}

export interface OrderLine {
  lineNumber: number;
  categoryId: string;
  productId: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
}

/** Money is in hundredths; `orderDate` is epoch milliseconds. */
export interface PurchaseOrder {
  orderId: string;
  userId: string;
  email: string;
  locale: string;
  orderDate: number;
  total: number;
  billing: Contact;
  shipping: Contact;
  card: { cardNumber: string; cardType: string; expiryDate: string };
  lines: OrderLine[];
}

const esc = (v: unknown) =>
  String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const el = (name: string, v: unknown) => `<${name}>${esc(v)}</${name}>`;

const contactXml = (name: string, c: Contact) =>
  `<${name}>${el("GivenName", c.givenName)}${el("FamilyName", c.familyName)}${el("Street", c.street)}${
    c.street2 ? el("Street2", c.street2) : ""
  }${el("City", c.city)}${el("State", c.state)}${el("Zip", c.zip)}${el("Country", c.country)}${el(
    "Email",
    c.email,
  )}${el("Phone", c.phone)}</${name}>`;

/** The order document, elements in the required order. The date is ISO text (design.md SD8). */
export function toXml(po: PurchaseOrder): string {
  const c = po.card;
  const lines = po.lines
    .map(
      (l) =>
        `<LineItem>${el("LineNumber", l.lineNumber)}${el("CategoryId", l.categoryId)}${el(
          "ProductId",
          l.productId,
        )}${el("ItemId", l.itemId)}${el("Quantity", l.quantity)}${el("UnitPrice", l.unitPrice)}</LineItem>`,
    )
    .join("");
  return `<PurchaseOrder>${el("OrderId", po.orderId)}${el("UserId", po.userId)}${el(
    "Email",
    po.email,
  )}${el("Locale", po.locale || "en_US")}${el("OrderDate", new Date(po.orderDate).toISOString())}${el(
    "Total",
    po.total,
  )}${contactXml("BillingInfo", po.billing)}${contactXml("ShippingInfo", po.shipping)}<CreditCard>${el(
    "CardNumber",
    c.cardNumber,
  )}${el("CardType", c.cardType)}${el("ExpiryDate", c.expiryDate)}</CreditCard><LineItems>${lines}</LineItems></PurchaseOrder>`;
}

const parser = new XMLParser({
  parseTagValue: false,
  trimValues: true,
  isArray: (name) => name === "LineItem",
});

type Node = Record<string, unknown>;
const node = (v: unknown, expected: string): Node => {
  if (typeof v !== "object" || v === null) throw new Error(`${expected} element expected.`);
  return v as Node;
};
const text = (n: Node, name: string): string => {
  const v = n[name];
  if (v === undefined || v === null) return "";
  if (typeof v === "object") throw new Error(`${name} must hold text.`);
  return String(v);
};
const num = (n: Node, name: string): number => {
  if (text(n, name) === "") throw new Error(`${name} element expected.`);
  const v = Number(text(n, name));
  if (!Number.isFinite(v)) throw new Error(`${name} must be a number.`);
  return v;
};

function contactOf(root: Node, name: string): Contact {
  const n = node(root[name], name);
  const street2 = text(n, "Street2");
  return {
    givenName: text(n, "GivenName"),
    familyName: text(n, "FamilyName"),
    street: text(n, "Street"),
    ...(street2 && { street2 }),
    city: text(n, "City"),
    state: text(n, "State"),
    country: text(n, "Country"),
    zip: text(n, "Zip"),
    email: text(n, "Email"),
    phone: text(n, "Phone"),
  };
}

/** Reads an order document; rejects one that is not a purchase order or whose card is not a CreditCard. */
export function fromXml(xml: string): PurchaseOrder {
  const doc = parser.parse(xml) as Node;
  const root = doc["PurchaseOrder"];
  if (typeof root !== "object" || root === null) throw new Error("PurchaseOrder element expected.");
  const r = root as Node;
  const card = node(r["CreditCard"], "CreditCard");
  const orderDate = Date.parse(text(r, "OrderDate"));
  if (Number.isNaN(orderDate)) throw new Error("OrderDate is not a date.");
  const items = ((r["LineItems"] as Node | undefined)?.["LineItem"] ?? []) as Node[];
  if (text(r, "OrderId") === "") throw new Error("OrderId element expected.");
  return {
    orderId: text(r, "OrderId"),
    userId: text(r, "UserId"),
    email: text(r, "Email"),
    locale: text(r, "Locale") || "en_US",
    orderDate,
    total: num(r, "Total"),
    billing: contactOf(r, "BillingInfo"),
    shipping: contactOf(r, "ShippingInfo"),
    card: {
      cardNumber: text(card, "CardNumber"),
      cardType: text(card, "CardType"),
      expiryDate: text(card, "ExpiryDate"),
    },
    lines: items.map((l) => ({
      lineNumber: num(l, "LineNumber"),
      categoryId: text(l, "CategoryId"),
      productId: text(l, "ProductId"),
      itemId: text(l, "ItemId"),
      quantity: num(l, "Quantity"),
      unitPrice: num(l, "UnitPrice"),
    })),
  };
}

/** Month and year of an `ExpiryDate` written `<month>/<year>`; text of any other shape has neither. */
export function parseExpiry(text: string): { month: number; year: number } | null {
  const m = /^(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const month = Number(m[1]);
  return month >= 1 && month <= 12 ? { month, year: Number(m[2]) } : null;
}
