import { and, asc, or, sql } from "drizzle-orm";

import { catalogCategories, catalogProducts } from "../../db/schema";
import { catalogItemDetails, catalogItems, catalogProductDetails } from "../../db/schema";
import { itemsQuery, toItemRow } from "./data-access";
import { CatalogError } from "./errors";
import type { CatalogItem } from "./index";
import { type CatalogPage, pageOf } from "./paging";

/** Distinct whitespace-separated keywords, in first-seen order. */
function keywordsOf(text: string): string[] {
  return [...new Set(text.split(/\s+/).filter(Boolean))];
}

/** `%kw%` for a LIKE ... ESCAPE '\' match, with the LIKE wildcards in `kw` taken literally. */
const pattern = (keyword: string) => `%${keyword.toLowerCase().replace(/[\\%_]/g, "\\$&")}%`;

/**
 * Items of `locale` where any keyword is a case-insensitive substring of the product name,
 * the category id or the item description. Blank text returns the empty page without a query.
 */
export async function search(
  text: string,
  locale: string,
  start = 0,
  size = 2,
): Promise<CatalogPage<CatalogItem>> {
  const keywords = keywordsOf(text);
  if (keywords.length === 0 || start < 0) return pageOf<CatalogItem>([], start, size);
  const matches = keywords.map((kw) => {
    const p = pattern(kw);
    return or(
      sql`lower(${catalogProductDetails.name}) like ${p} escape '\\'`,
      sql`lower(${catalogProducts.categoryId}) like ${p} escape '\\'`,
      sql`lower(${catalogItemDetails.description}) like ${p} escape '\\'`,
    );
  });
  try {
    const rows = itemsQuery(locale)
      .innerJoin(catalogProducts, sql`${catalogProducts.productId} = ${catalogItems.productId}`)
      .innerJoin(
        catalogCategories,
        sql`${catalogCategories.categoryId} = ${catalogProducts.categoryId}`,
      )
      .where(and(or(...matches)))
      .orderBy(asc(catalogItems.itemId))
      .limit(size + 1)
      .offset(start)
      .all();
    return pageOf(
      rows.map((r) => ({ ...toItemRow(r), locale })),
      start,
      size,
    );
  } catch (e) {
    throw new CatalogError("Catalog store failure", { cause: e });
  }
}
