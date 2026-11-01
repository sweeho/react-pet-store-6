/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stub */
import type { PurchaseOrder } from "../documents/purchase-order";

export type { PurchaseOrder };

export function createPurchaseOrder(_unit: unknown, _po: PurchaseOrder): void {
  throw new Error("VortexNotImplemented");
}

export function getPurchaseOrder(_orderId: string): PurchaseOrder | undefined {
  throw new Error("VortexNotImplemented");
}

export function receiveOrderDocument(_xml: string): void {
  throw new Error("VortexNotImplemented");
}
