import type { Executor } from "../ids";

export const receiveSupplierPurchaseOrder: (_tx: Executor, _xml: string) => void = () => {
  throw new Error("VortexNotImplemented");
};

export const fulfilOrder: (_tx: Executor, _orderId: string) => void = () => {
  throw new Error("VortexNotImplemented");
};

export const refulfil: (_tx: Executor, _payload: string) => void = () => {
  throw new Error("VortexNotImplemented");
};
