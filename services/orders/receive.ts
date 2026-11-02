/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PurchaseOrder } from "../documents/purchase-order";

export function createPurchaseOrder(_db: unknown, _po: PurchaseOrder): Promise<void> {
  throw new Error("VortexNotImplemented");
}
export function getPurchaseOrder(_orderId: string): Promise<PurchaseOrder | undefined> {
  throw new Error("VortexNotImplemented");
}
export function receiveOrder(_messageId: number): Promise<void> {
  throw new Error("VortexNotImplemented");
}
