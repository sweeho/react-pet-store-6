export interface CatalogPage<T> {
  items: T[];
  start: number;
  size: number;
  hasPrevious: boolean;
  hasNext: boolean;
  previousStart: number;
  nextStart: number;
}

export function pageOf<T>(rows: T[], start = 0, size = 2): CatalogPage<T> {
  void [rows, start, size];
  throw new Error("VortexNotImplemented");
}
