import type { Executor } from "../ids";

const notImplemented = (): never => {
  throw new Error("VortexNotImplemented");
};

export const onApproval: (tx: Executor, payload: string) => void = notImplemented;
export const onShipment: (tx: Executor, payload: string) => void = notImplemented;
export const onCompleted: (tx: Executor, payload: string) => void = notImplemented;
