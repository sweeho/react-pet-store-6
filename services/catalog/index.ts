import {
  type CategoryRow,
  type Dialect,
  type ItemRow,
  type ProductRow,
  resolveDataAccess,
} from "./data-access";
import { CatalogError } from "./errors";
import { type CatalogPage, pageOf } from "./paging";

export { CatalogError } from "./errors";
export { registerDataAccess } from "./data-access";
export type { CatalogPage } from "./paging";

export interface CatalogItem extends ItemRow {
  locale: string;
}

/** Runs a store read, reporting any failure as a CatalogError. */
async function guarded<T>(read: () => Promise<T>): Promise<T> {
  try {
    return await read();
  } catch (e) {
    if (e instanceof CatalogError) throw e;
    throw new CatalogError("Catalog store failure", { cause: e });
  }
}

/** One page: the read asks for one extra row to learn whether a later page exists. */
async function page<T>(
  start: number,
  size: number,
  read: (offset: number, limit: number) => Promise<T[]>,
): Promise<CatalogPage<T>> {
  if (start < 0) return pageOf<T>([], start, size);
  return pageOf(await guarded(() => read(start, size + 1)), start, size);
}

export function listCategories(
  locale: string,
  start = 0,
  size = 2,
): Promise<CatalogPage<CategoryRow>> {
  return page(start, size, (o, l) => resolveDataAccess().listCategories(locale, o, l));
}

export function listProducts(
  categoryId: string,
  locale: string,
  start = 0,
  size = 2,
): Promise<CatalogPage<ProductRow>> {
  return page(start, size, (o, l) => resolveDataAccess().listProducts(categoryId, locale, o, l));
}

export async function listItems(productId: string, locale: string): Promise<CatalogPage<ItemRow>> {
  const items = await guarded(() => resolveDataAccess().listItems(productId, locale));
  return pageOf(items, 0, items.length);
}

export function getCategory(categoryId: string, locale: string): Promise<CategoryRow | undefined> {
  return guarded(() => resolveDataAccess().getCategory(categoryId, locale));
}

export function getProduct(productId: string, locale: string): Promise<ProductRow | undefined> {
  return guarded(() => resolveDataAccess().getProduct(productId, locale));
}

/** The item's display data from exactly the given locale's detail rows. */
export async function getItem(itemId: string, locale: string): Promise<CatalogItem | undefined> {
  const row = await guarded(() => resolveDataAccess().getItem(itemId, locale));
  return row && { ...row, locale };
}

/** Placeholder until the search task (SWHR2-T-0145) lands: returns no matches. */
export async function search(text: string, locale: string): Promise<CatalogItem[]> {
  void [text, locale];
  return [];
}

/** The dialect of the configured data-access implementation. */
export function catalogDialect(): Dialect {
  return resolveDataAccess().dialect;
}
