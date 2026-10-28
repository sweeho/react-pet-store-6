import path from "node:path";

import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import {
  catalogCategories,
  catalogItemDetails,
  catalogItems,
  catalogProductDetails,
  catalogProducts,
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

export const db = drizzle(sqlite, { schema: { users } });

migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

// Seed the same two users the mock API used to hardcode, so the demo data
// (and the existing route tests) keep working out of the box.
if (db.select().from(users).all().length === 0) {
  db.insert(users)
    .values([
      { name: "John Doe", email: "john@example.com" },
      { name: "Jane Smith", email: "jane@example.com" },
    ])
    .run();
}

// Legacy Pet Store demo catalog: FISH / FI-SW-01 / EST-1 in the three storefront
// locales, with the legacy per-locale prices (major units, design.md SD3).
if (!process.env.VITEST && db.select().from(catalogItems).all().length === 0) {
  const product = [
    ["en_US", "Angelfish", "Salt Water fish from Australia"],
    ["ja_JP", "エンゼルフィッシュ", "オーストラリア産の海水魚"],
    ["zh_CN", "天使鱼", "来自澳大利亚的海水鱼"],
  ] as const;
  const item = [
    ["en_US", "Large Angelfish", "Spotted", 16.5, 10],
    ["ja_JP", "大きなエンゼルフィッシュ", "斑点あり", 1951, 1551],
    ["zh_CN", "大天使鱼", "有斑点", 142, 86],
  ] as const;
  db.insert(catalogCategories).values({ categoryId: "FISH" }).run();
  db.insert(catalogProducts).values({ productId: "FI-SW-01", categoryId: "FISH" }).run();
  db.insert(catalogItems).values({ itemId: "EST-1", productId: "FI-SW-01" }).run();
  db.insert(catalogProductDetails)
    .values(
      product.map(([locale, name, description]) => ({
        productId: "FI-SW-01",
        locale,
        name,
        description,
        image: "fish1.gif",
      })),
    )
    .run();
  db.insert(catalogItemDetails)
    .values(
      item.map(([locale, description, attr1, listPrice, unitCost]) => ({
        itemId: "EST-1",
        locale,
        description,
        image: "fish1.jpg",
        attr1,
        listPrice,
        unitCost,
      })),
    )
    .run();
}
