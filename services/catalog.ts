/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stubs */
export interface CatalogItem {
  itemId: string;
  locale: string;
  name: string;
  description: string;
  attributes: string[];
  listPrice: number;
  unitCost: number;
}

export function getItem(_itemId: string, _locale: string): CatalogItem | undefined {
  throw new Error("VortexNotImplemented");
}
