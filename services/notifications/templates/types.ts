/** A line of a completed order; every value is already HTML-escaped and formatted. */
export interface TemplateLine {
  category: string;
  product: string;
  quantity: number;
  unitPrice: string;
}

/** Bodies of the three order e-mails in one locale. Subjects are fixed and set by the handlers. */
export interface Templates {
  approval(orderId: string, status: string): string;
  shipment(orderId: string): string;
  completed(orderId: string, lines: TemplateLine[]): string;
}
