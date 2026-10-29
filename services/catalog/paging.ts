export interface CatalogPage<T> {
  items: T[];
  start: number;
  size: number;
  hasPrevious: boolean;
  hasNext: boolean;
  previousStart: number;
  nextStart: number;
}

const emptyPage = <T>(size: number): CatalogPage<T> => ({
  items: [],
  start: 0,
  size,
  hasPrevious: false,
  hasNext: false,
  previousStart: 0,
  nextStart: 0,
});

/**
 * Legacy Page arithmetic. `rows` are those read from `start` with one look-ahead
 * row (`size + 1` requested). A negative start or no rows gives the empty page.
 */
export function pageOf<T>(rows: T[], start = 0, size = 2): CatalogPage<T> {
  if (start < 0 || rows.length === 0) return emptyPage(size);
  const items = rows.slice(0, size);
  return {
    items,
    start,
    size,
    hasPrevious: start > 0,
    hasNext: rows.length > size,
    previousStart: Math.max(start - items.length, 0),
    nextStart: start + items.length,
  };
}
