import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
});

// Storefront sign-on credentials; password_hash is a Bun.password (argon2id) hash.
// customer-account (SWHR2-I-0006) adds its rows here and keeps these two columns.
export const signonUsers = sqliteTable("signon_users", {
  userId: text("user_id").primaryKey(),
  passwordHash: text("password_hash").notNull(),
});

// Catalog display tables. `*_details` rows are keyed by (id, locale); the
// column names are fixed by tests/acceptance/catalog-browsing/harness.ts.
export const catalogCategories = sqliteTable(
  "catalog_categories",
  {
    categoryId: text("category_id").primaryKey().notNull(),
  },
  (t) => [check("catalog_categories_id_length", sql`length(${t.categoryId}) <= 10`)],
);

export const catalogCategoryDetails = sqliteTable(
  "catalog_category_details",
  {
    categoryId: text("category_id")
      .notNull()
      .references(() => catalogCategories.categoryId),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    image: text("image").notNull(),
  },
  (t) => [primaryKey({ columns: [t.categoryId, t.locale] })],
);

export const catalogProducts = sqliteTable(
  "catalog_products",
  {
    productId: text("product_id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => catalogCategories.categoryId),
  },
  (t) => [index("catalog_products_category_idx").on(t.categoryId)],
);

export const catalogProductDetails = sqliteTable(
  "catalog_product_details",
  {
    productId: text("product_id")
      .notNull()
      .references(() => catalogProducts.productId),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    image: text("image").notNull(),
  },
  (t) => [primaryKey({ columns: [t.productId, t.locale] })],
);

export const catalogItems = sqliteTable(
  "catalog_items",
  {
    itemId: text("item_id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => catalogProducts.productId),
  },
  (t) => [index("catalog_items_product_idx").on(t.productId)],
);

// list_price / unit_cost are integer hundredths of the displayed unit (design.md P1).
export const catalogItemDetails = sqliteTable(
  "catalog_item_details",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => catalogItems.itemId),
    locale: text("locale").notNull(),
    description: text("description").notNull(),
    image: text("image").notNull(),
    listPrice: integer("list_price").notNull(),
    unitCost: integer("unit_cost").notNull(),
    attr1: text("attr1"),
    attr2: text("attr2"),
    attr3: text("attr3"),
    attr4: text("attr4"),
    attr5: text("attr5"),
  },
  (t) => [primaryKey({ columns: [t.itemId, t.locale] })],
);

// Customer account (SWHR2-I-0006). A customer is keyed by its sign-on user id and owns one
// account (status, contact, payment card) and one profile.
export const addresses = sqliteTable("addresses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  street1: text("street1").notNull(),
  street2: text("street2").notNull().default(""),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  country: text("country").notNull(),
});

export const contactInfo = sqliteTable("contact_info", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  givenName: text("given_name").notNull(),
  familyName: text("family_name").notNull(),
  telephone: text("telephone").notNull(),
  email: text("email").notNull(),
  addressId: integer("address_id")
    .notNull()
    .references(() => addresses.id),
});

export const customers = sqliteTable("customers", {
  userId: text("user_id")
    .primaryKey()
    .references(() => signonUsers.userId),
});

export const customerAccounts = sqliteTable(
  "customer_accounts",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => customers.userId),
    status: text("status").notNull().default("active"),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contactInfo.id),
    cardNumber: text("card_number").notNull(),
    cardType: text("card_type").notNull(),
    cardExpiryMonth: integer("card_expiry_month").notNull(),
    cardExpiryYear: integer("card_expiry_year").notNull(),
  },
  (t) => [check("customer_accounts_status", sql`${t.status} in ('active', 'disabled')`)],
);

export const customerProfiles = sqliteTable("customer_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => customers.userId),
  preferredLanguage: text("preferred_language").notNull().default("en_US"),
  favouriteCategory: text("favourite_category"),
  myListOn: integer("my_list_on", { mode: "boolean" }).notNull().default(true),
  bannerOn: integer("banner_on", { mode: "boolean" }).notNull().default(true),
});
