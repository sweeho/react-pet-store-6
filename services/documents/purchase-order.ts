/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stub */

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
export function toXml(_po: PurchaseOrder): string {
  throw new Error("VortexNotImplemented");
}

export function fromXml(_xml: string): PurchaseOrder {
  throw new Error("VortexNotImplemented");
}
