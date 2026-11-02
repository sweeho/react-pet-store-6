export interface InvoiceInput {
  orderId?: string;
  userId?: string;
  shippingDate?: string;
  lines: { lineNumber: number; itemId: string; quantity: number }[];
}

export const buildInvoice: (_input: InvoiceInput) => string = () => {
  throw new Error("VortexNotImplemented");
};
