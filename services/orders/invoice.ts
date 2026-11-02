import type { Executor } from "../ids";

export interface InvoiceRead {
  orderId: string;
  lines: { itemId: string; quantity: number }[];
  shipped: Record<string, number>;
}

export const readInvoice: (_xml: string) => InvoiceRead = () => {
  throw new Error("VortexNotImplemented");
};

export const handleInvoice: (_xml: string, _exec?: Executor) => void = () => {
  throw new Error("VortexNotImplemented");
};
