import { XMLBuilder, XMLParser } from "fast-xml-parser";

/** A billing or shipping contact with its address. */
export interface Party {
  givenName: string;
  familyName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
}

export interface PurchaseOrderLine {
  lineNumber: number;
  categoryId: string;
  productId: string;
  itemId: string;
  quantity: number;
  /** Hundredths of the order currency. */
  unitPrice: number;
}

/** An order as the order document carries it; money is in hundredths. */
export interface PurchaseOrder {
  orderId: string;
  userId: string;
  email: string;
  locale: string;
  orderDate: number;
  total: number;
  billing: Party;
  shipping: Party;
  card: { cardNumber: string; cardType: string; expiryDate: string };
  lines: PurchaseOrderLine[];
}

const PARTY_ELEMENTS: [keyof Party, string][] = [
  ["givenName", "GivenName"],
  ["familyName", "FamilyName"],
  ["street", "Street"],
  ["city", "City"],
  ["state", "State"],
  ["zip", "Zip"],
  ["country", "Country"],
  ["phone", "Phone"],
  ["email", "Email"],
];

const builder = new XMLBuilder({ format: false, suppressEmptyNode: false });
// Every value stays text (a zip or card number keeps its leading zeros); numbers are read below.
const parser = new XMLParser({
  parseTagValue: false,
  trimValues: false,
  isArray: (name) => name === "LineItem",
});

const partyNode = (p: Party) => Object.fromEntries(PARTY_ELEMENTS.map(([k, el]) => [el, p[k]]));

/** Renders the order document: root `PurchaseOrder`, card `CreditCard` (number, type, expiry). */
export function toXml(po: PurchaseOrder): string {
  return builder.build({
    PurchaseOrder: {
      OrderId: po.orderId,
      UserId: po.userId,
      EmailId: po.email,
      OrderDate: po.orderDate,
      Locale: po.locale,
      TotalPrice: po.total,
      BillingInfo: partyNode(po.billing),
      ShippingInfo: partyNode(po.shipping),
      CreditCard: {
        CardNumber: po.card.cardNumber,
        CardType: po.card.cardType,
        ExpiryDate: po.card.expiryDate,
      },
      LineItems: {
        LineItem: po.lines.map((l) => ({
          LineNumber: l.lineNumber,
          CategoryId: l.categoryId,
          ProductId: l.productId,
          ItemId: l.itemId,
          Quantity: l.quantity,
          UnitPrice: l.unitPrice,
        })),
      },
    },
  });
}

type Node = Record<string, unknown>;

function child(parent: Node, name: string): Node {
  const v = parent[name];
  if (v === undefined || v === null || typeof v !== "object")
    throw new Error(`${name} element expected.`);
  return v as Node;
}

function text(parent: Node, name: string): string {
  const v = parent[name];
  if (v === undefined) throw new Error(`${name} element expected.`);
  return typeof v === "string" ? v : "";
}

function int(parent: Node, name: string): number {
  const n = Number(text(parent, name));
  if (!Number.isInteger(n)) throw new Error(`${name} must be a whole number.`);
  return n;
}

function party(parent: Node, name: string): Party {
  // An empty element parses to "", which is a contact with no fields.
  const node = parent[name] === "" ? {} : child(parent, name);
  return Object.fromEntries(
    PARTY_ELEMENTS.map(([k, el]) => [k, text(node, el)]),
  ) as unknown as Party;
}

/** Reads an order document; rejects one that is not a `PurchaseOrder` or whose card is not a `CreditCard`. */
export function fromXml(xml: string): PurchaseOrder {
  const parsed = parser.parse(xml) as Node;
  const root = parsed.PurchaseOrder;
  if (root === undefined || root === null || typeof root !== "object")
    throw new Error("PurchaseOrder element expected.");
  const po = root as Node;
  if (typeof po.CreditCard !== "object" || po.CreditCard === null)
    throw new Error("CreditCard element expected.");
  const card = po.CreditCard as Node;
  const items = po.LineItems;
  const lineNodes =
    items && typeof items === "object"
      ? (((items as Node).LineItem as Node[] | undefined) ?? [])
      : [];
  return {
    orderId: text(po, "OrderId"),
    userId: text(po, "UserId"),
    email: text(po, "EmailId"),
    locale: text(po, "Locale"),
    orderDate: int(po, "OrderDate"),
    total: int(po, "TotalPrice"),
    billing: party(po, "BillingInfo"),
    shipping: party(po, "ShippingInfo"),
    card: {
      cardNumber: text(card, "CardNumber"),
      cardType: text(card, "CardType"),
      expiryDate: text(card, "ExpiryDate"),
    },
    lines: lineNodes.map((l) => ({
      lineNumber: int(l, "LineNumber"),
      categoryId: text(l, "CategoryId"),
      productId: text(l, "ProductId"),
      itemId: text(l, "ItemId"),
      quantity: int(l, "Quantity"),
      unitPrice: int(l, "UnitPrice"),
    })),
  };
}
