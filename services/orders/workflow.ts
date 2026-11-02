import type { Executor } from "../ids";

export const ORDER_STATUSES = [
  "PENDING",
  "APPROVED",
  "DENIED",
  "SHIPPED_PART",
  "COMPLETED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const startWorkflow: (
  _exec: Executor,
  _orderId: string,
  _status: OrderStatus,
) => void = () => {
  throw new Error("VortexNotImplemented");
};

export const getOrderStatus: (_orderId: string) => OrderStatus = () => {
  throw new Error("VortexNotImplemented");
};

export const setStatus: (_exec: Executor, _orderId: string, _to: OrderStatus) => boolean = () => {
  throw new Error("VortexNotImplemented");
};
