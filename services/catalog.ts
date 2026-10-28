import { and, eq } from "drizzle-orm";

import { db } from "../db/client";
import { catalogItemDetails, catalogItems, catalogProductDetails } from "../db/schema";

export interface CatalogItem {
  itemId: string;
  locale: string;
  name: string;
  description: string;
  attributes: string[];
  listPrice: number;
  unitCost: number;
}

/** The item's display data from exactly the given locale's detail rows. */
export function getItem(itemId: string, locale: string): CatalogItem | undefined {
  const row = db
    .select({
      name: catalogProductDetails.name,
      d: catalogItemDetails,
    })
    .from(catalogItems)
    .innerJoin(
      catalogItemDetails,
      and(
        eq(catalogItemDetails.itemId, catalogItems.itemId),
        eq(catalogItemDetails.locale, locale),
      ),
    )
    .innerJoin(
      catalogProductDetails,
      and(
        eq(catalogProductDetails.productId, catalogItems.productId),
        eq(catalogProductDetails.locale, locale),
      ),
    )
    .where(eq(catalogItems.itemId, itemId))
    .get();
  if (!row) return undefined;
  const { d } = row;
  return {
    itemId,
    locale,
    name: row.name,
    description: d.description,
    attributes: [d.attr1, d.attr2, d.attr3, d.attr4, d.attr5].filter((a): a is string => !!a),
    listPrice: d.listPrice,
    unitCost: d.unitCost,
  };
}
