import path from "node:path";

import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import {
  catalogCategories,
  catalogCategoryDetails,
  catalogItemDetails,
  catalogItems,
  catalogProductDetails,
  catalogProducts,
  addresses,
  contactInfo,
  customerAccounts,
  customerProfiles,
  customers,
  idSequences,
  messages,
  opOrderWorkflow,
  opPoCards,
  opPoContacts,
  opPoLineItems,
  opPurchaseOrders,
  supInventory,
  signonUsers,
  users,
} from "./schema";

// Vitest sets VITEST=true in every worker; an in-memory db keeps route
// integration tests isolated from the file-backed dev/prod db and from
// each other (each test module gets its own fresh Database instance).
// Paths are cwd-relative rather than import.meta.url-relative because Vite
// (dev server, Nitro build, Vitest) transforms this module, so its
// import.meta.url isn't a real file:// URL — cwd is always the project root
// across dev/build/test.
const sqlite = new Database(
  process.env.VITEST ? ":memory:" : path.join(process.cwd(), "sqlite.db"),
);

// The order worker polls this file while other processes (e2e helpers, tools) write to it: WAL keeps
// readers from blocking writers, and a busy timeout makes a competing write wait instead of failing.
if (!process.env.VITEST) {
  sqlite.exec("PRAGMA journal_mode = WAL");
  sqlite.exec("PRAGMA busy_timeout = 5000");
}

export const db = drizzle(sqlite, {
  schema: {
    users,
    signonUsers,
    addresses,
    contactInfo,
    customers,
    customerAccounts,
    customerProfiles,
    catalogCategories,
    catalogCategoryDetails,
    catalogProducts,
    catalogProductDetails,
    catalogItems,
    catalogItemDetails,
    idSequences,
    messages,
    opPurchaseOrders,
    opPoContacts,
    opPoCards,
    opPoLineItems,
    opOrderWorkflow,
    supInventory,
  },
});

const migrationsFolder = path.join(process.cwd(), "drizzle");

/**
 * Drizzle's journal records that a migration ran, so `migrate()` never recreates a table dropped
 * afterwards. This runs the same migrations on a throwaway in-memory database and creates, with its
 * reference SQL, every table (and that table's indexes) that exists there but not in `sqlite`.
 * Existing tables are not touched (SWHR2-R-0074.02).
 */
export function repairMissingTables(target: Database, folder: string): void {
  const reference = new Database(":memory:");
  try {
    migrate(drizzle(reference), { migrationsFolder: folder });
    const have = new Set(
      (
        target.query("select name from sqlite_master where type = 'table'").all() as {
          name: string;
        }[]
      ).map((t) => t.name),
    );
    const refRows = reference
      .query(
        "select type, name, tbl_name, sql from sqlite_master where sql is not null and name not like 'sqlite_%' order by rowid",
      )
      .all() as { type: string; name: string; tbl_name: string; sql: string }[];
    const missing = new Set(
      refRows.filter((r) => r.type === "table" && !have.has(r.name)).map((r) => r.name),
    );
    for (const r of refRows)
      if ((r.type === "table" || r.type === "index") && missing.has(r.tbl_name)) target.exec(r.sql);
  } finally {
    reference.close();
  }
}

migrate(db, { migrationsFolder });
repairMissingTables(sqlite, migrationsFolder);

// Enforce the catalog references. Enabled after migrating because the table
// rebuilds in migration 0002 drop and recreate referenced tables.
sqlite.exec("PRAGMA foreign_keys = ON");
