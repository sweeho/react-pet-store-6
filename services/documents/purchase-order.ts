/* eslint-disable @typescript-eslint/no-unused-vars */
export interface PurchaseOrder {
  [key: string]: unknown;
}
export function toXml(_po: PurchaseOrder): string {
  throw new Error("VortexNotImplemented");
}
export function fromXml(_xml: string): PurchaseOrder {
  throw new Error("VortexNotImplemented");
}
