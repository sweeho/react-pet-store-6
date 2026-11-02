/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stubs */
import type { Executor } from "../ids";

export interface StockRow {
  itemId: string;
  quantity: number;
}

const stub = (): never => {
  throw new Error("VortexNotImplemented");
};

export function listInventory(_exec?: Executor): StockRow[] {
  return stub();
}

export function updateInventory(_changes: StockRow[], _exec?: Executor): void {
  stub();
}

export function reduceStock(_exec: Executor, _itemId: string, _quantity: number): boolean {
  return stub();
}
