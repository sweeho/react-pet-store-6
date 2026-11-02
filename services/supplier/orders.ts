import type { Executor } from "../ids";
import type { SupplierOrderInput } from "../documents/supplier-order";

export const createSupplierOrder: (_exec: Executor, _input: SupplierOrderInput) => void = () => {
  throw new Error("VortexNotImplemented");
};

export const listSupplierOrders: (status: string) => { orderId: string; status: string }[] = () => {
  throw new Error("VortexNotImplemented");
};
