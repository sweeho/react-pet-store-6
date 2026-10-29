import { and, asc, eq } from "drizzle-orm";

import { db } from "../../db/client";
import {
  catalogCategoryDetails,
  catalogItemDetails,
  catalogItems,
  catalogProductDetails,
  catalogProducts,
} from "../../db/schema";
import { CatalogError } from "./errors";

export type Dialect = "sqlite";

export interface CategoryRow {
  categoryId: string;
  name: string;
  description: string;
  image: string;
}

export interface ProductRow {
  productId: string;
  categoryId: string;
  name: string;
  description: string;
  image: string;
}

export interface ItemRow {
  itemId: string;
  productId: string;
  /** The product's name in the item's locale. */
  name: string;
  description: string;
  image: string;
  attributes: string[];
  listPrice: number;
  unitCost: number;
}

/** Every read is for exactly one locale; there is no fallback to another. */
export interface DataAccess {
  readonly dialect: Dialect;
  listCategories(locale: string, offset: number, limit: number): Promise<CategoryRow[]>;
  getCategory(categoryId: string, locale: string): Promise<CategoryRow | undefined>;
  listProducts(
    categoryId: string,
    locale: string,
    offset: number,
    limit: number,
  ): Promise<ProductRow[]>;
  getProduct(productId: string, locale: string): Promise<ProductRow | undefined>;
  /** Only items whose product is also localized in `locale`. */
  listItems(productId: string, locale: string): Promise<ItemRow[]>;
  getItem(itemId: string, locale: string): Promise<ItemRow | undefined>;
}

const categoryColumns = {
  categoryId: catalogCategoryDetails.categoryId,
  name: catalogCategoryDetails.name,
  description: catalogCategoryDetails.description,
  image: catalogCategoryDetails.image,
};

const productColumns = {
  productId: catalogProducts.productId,
  categoryId: catalogProducts.categoryId,
  name: catalogProductDetails.name,
  description: catalogProductDetails.description,
  image: catalogProductDetails.image,
};

const itemColumns = {
  itemId: catalogItems.itemId,
  productId: catalogItems.productId,
  name: catalogProductDetails.name,
  d: catalogItemDetails,
};

type ItemJoined = {
  itemId: string;
  productId: string;
  name: string;
  d: typeof catalogItemDetails.$inferSelect;
};

function toItemRow({ itemId, productId, name, d }: ItemJoined): ItemRow {
  return {
    itemId,
    productId,
    name,
    description: d.description,
    image: d.image,
    attributes: [d.attr1, d.attr2, d.attr3, d.attr4, d.attr5].filter((a): a is string => !!a),
    listPrice: d.listPrice,
    unitCost: d.unitCost,
  };
}

/** Items joined to their item details and product details on the same locale. */
function itemsQuery(locale: string) {
  return db
    .select(itemColumns)
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
    );
}

function productsQuery(locale: string) {
  return db
    .select(productColumns)
    .from(catalogProducts)
    .innerJoin(
      catalogProductDetails,
      and(
        eq(catalogProductDetails.productId, catalogProducts.productId),
        eq(catalogProductDetails.locale, locale),
      ),
    );
}

export const drizzleDataAccess: DataAccess = {
  dialect: "sqlite",
  async listCategories(locale, offset, limit) {
    return db
      .select(categoryColumns)
      .from(catalogCategoryDetails)
      .where(eq(catalogCategoryDetails.locale, locale))
      .orderBy(asc(catalogCategoryDetails.name), asc(catalogCategoryDetails.categoryId))
      .limit(limit)
      .offset(offset)
      .all();
  },
  async getCategory(categoryId, locale) {
    return db
      .select(categoryColumns)
      .from(catalogCategoryDetails)
      .where(
        and(
          eq(catalogCategoryDetails.categoryId, categoryId),
          eq(catalogCategoryDetails.locale, locale),
        ),
      )
      .get();
  },
  async listProducts(categoryId, locale, offset, limit) {
    return productsQuery(locale)
      .where(eq(catalogProducts.categoryId, categoryId))
      .orderBy(asc(catalogProductDetails.name), asc(catalogProducts.productId))
      .limit(limit)
      .offset(offset)
      .all();
  },
  async getProduct(productId, locale) {
    return productsQuery(locale).where(eq(catalogProducts.productId, productId)).get();
  },
  async listItems(productId, locale) {
    return itemsQuery(locale)
      .where(eq(catalogItems.productId, productId))
      .orderBy(asc(catalogItems.itemId))
      .all()
      .map(toItemRow);
  },
  async getItem(itemId, locale) {
    const row = itemsQuery(locale).where(eq(catalogItems.itemId, itemId)).get();
    return row && toItemRow(row);
  },
};

const registry = new Map<string, DataAccess>([["drizzle", drizzleDataAccess]]);

/** Makes `impl` selectable by name through the CATALOG_DATA_ACCESS setting. */
export function registerDataAccess(name: string, impl: DataAccess): void {
  registry.set(name, impl);
}

/** The implementation named by CATALOG_DATA_ACCESS (default "drizzle"). Resolved on every read. */
export function resolveDataAccess(): DataAccess {
  const name = process.env.CATALOG_DATA_ACCESS || "drizzle";
  const impl = registry.get(name);
  if (!impl) throw new CatalogError(`Unknown catalog data access "${name}"`);
  const dialect = process.env.CATALOG_DB_DIALECT || "sqlite";
  if (impl.dialect !== dialect)
    throw new CatalogError(
      `Catalog data access "${name}" uses dialect "${impl.dialect}", not "${dialect}"`,
    );
  return impl;
}
