import { integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
});

// Catalog display tables. `*_details` rows are keyed by (id, locale); the
// column names are fixed by tests/acceptance/catalog-browsing/harness.ts.
export const catalogCategories = sqliteTable("catalog_categories", {
  categoryId: text("category_id").primaryKey(),
});

export const catalogCategoryDetails = sqliteTable(
  "catalog_category_details",
  {
    categoryId: text("category_id").notNull(),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    image: text("image").notNull(),
  },
  (t) => [primaryKey({ columns: [t.categoryId, t.locale] })],
);

export const catalogProducts = sqliteTable("catalog_products", {
  productId: text("product_id").primaryKey(),
  categoryId: text("category_id").notNull(),
});

export const catalogProductDetails = sqliteTable(
  "catalog_product_details",
  {
    productId: text("product_id").notNull(),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    image: text("image").notNull(),
  },
  (t) => [primaryKey({ columns: [t.productId, t.locale] })],
);

export const catalogItems = sqliteTable("catalog_items", {
  itemId: text("item_id").primaryKey(),
  productId: text("product_id").notNull(),
});

// list_price / unit_cost are major-unit reals (design.md SD3).
export const catalogItemDetails = sqliteTable(
  "catalog_item_details",
  {
    itemId: text("item_id").notNull(),
    locale: text("locale").notNull(),
    description: text("description").notNull(),
    image: text("image").notNull(),
    listPrice: real("list_price").notNull(),
    unitCost: real("unit_cost").notNull(),
    attr1: text("attr1"),
    attr2: text("attr2"),
    attr3: text("attr3"),
    attr4: text("attr4"),
    attr5: text("attr5"),
  },
  (t) => [primaryKey({ columns: [t.itemId, t.locale] })],
);
