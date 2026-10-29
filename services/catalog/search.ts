import type { CatalogPage } from "./paging";
import type { CatalogItem } from "./index";

export function search(
  text: string,
  locale: string,
  start?: number,
  size?: number,
): Promise<CatalogPage<CatalogItem>> {
  void [text, locale, start, size];
  throw new Error("VortexNotImplemented");
}
