/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stubs */
export interface CartLine {
  itemId: string;
  quantity: number;
  name: string;
  attribute: string;
  unitPrice: number;
}

export function addItem(_cart: Map<string, number>, _itemId: string): void {
  throw new Error("VortexNotImplemented");
}

export function lines(_cart: Map<string, number>, _locale?: string): CartLine[] {
  throw new Error("VortexNotImplemented");
}
