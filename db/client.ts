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

export const db = drizzle(sqlite, {
  schema: {
    users,
    catalogCategories,
    catalogCategoryDetails,
    catalogProducts,
    catalogProductDetails,
    catalogItems,
    catalogItemDetails,
  },
});

migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

// Enforce the catalog references. Enabled after migrating because the table
// rebuilds in migration 0002 drop and recreate referenced tables.
sqlite.exec("PRAGMA foreign_keys = ON");

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

// Seed fixture (design.md P6): five categories in the three storefront locales.
// Prices are integer hundredths of the displayed unit.
type L3 = readonly [en: string, ja: string, zh: string];
const LOCALES = ["en_US", "ja_JP", "zh_CN"] as const;
const categories: [string, L3][] = [
  ["BIRDS", ["Birds", "鳥", "鸟"]],
  ["CATS", ["Cats", "猫", "猫"]],
  ["DOGS", ["Dogs", "犬", "狗"]],
  ["FISH", ["Fish", "魚", "鱼"]],
  ["REPTILES", ["Reptiles", "爬虫類", "爬行动物"]],
];
const products: [string, string, string, L3][] = [
  ["FI-SW-01", "FISH", "fish1.gif", ["Angelfish", "エンゼルフィッシュ", "天使鱼"]],
  ["K9-BD-01", "DOGS", "dog2.gif", ["Bulldog", "ブルドッグ", "斗牛犬"]],
  ["K9-DL-01", "DOGS", "dog4.gif", ["Dalmation", "ダルメシアン", "斑点狗"]],
  ["K9-PO-02", "DOGS", "dog6.gif", ["Poodle", "プードル", "贵宾犬"]],
];
// [itemId, productId, image, descriptions, attr1, [listPrice, unitCost] per locale]
const items: [string, string, string, L3, L3, readonly [number, number][]][] = [
  [
    "EST-1",
    "FI-SW-01",
    "fish1.jpg",
    ["Large Angelfish", "大きなエンゼルフィッシュ", "大天使鱼"],
    ["Spotted", "斑点あり", "有斑点"],
    [
      [1650, 1000],
      [195100, 155100],
      [14200, 8600],
    ],
  ],
  [
    "EST-6",
    "K9-BD-01",
    "dog2.jpg",
    ["Male Adult Bulldog", "オスの成犬ブルドッグ", "成年雄性斗牛犬"],
    ["Friendly dog from England", "イギリス原産の友好的な犬", "来自英国的友好犬"],
    [
      [18350, 12000],
      [2100000, 1400000],
      [160000, 100000],
    ],
  ],
  [
    "EST-7",
    "K9-BD-01",
    "dog2.jpg",
    ["Female Puppy Bulldog", "メスの子犬ブルドッグ", "雌性幼年斗牛犬"],
    ["Friendly dog from England", "イギリス原産の友好的な犬", "来自英国的友好犬"],
    [
      [18350, 12000],
      [2100000, 1400000],
      [160000, 100000],
    ],
  ],
];

if (!process.env.VITEST && db.select().from(catalogCategories).all().length === 0) {
  db.transaction((tx) => {
    tx.insert(catalogCategories)
      .values(categories.map(([categoryId]) => ({ categoryId })))
      .run();
    tx.insert(catalogCategoryDetails)
      .values(
        categories.flatMap(([categoryId, names]) =>
          LOCALES.map((locale, i) => ({
            categoryId,
            locale,
            name: names[i],
            description: names[i],
            image: `${categoryId.toLowerCase()}_icon.gif`,
          })),
        ),
      )
      .run();
    tx.insert(catalogProducts)
      .values(products.map(([productId, categoryId]) => ({ productId, categoryId })))
      .run();
    tx.insert(catalogProductDetails)
      .values(
        products.flatMap(([productId, , image, names]) =>
          LOCALES.map((locale, i) => ({
            productId,
            locale,
            name: names[i],
            description: names[i],
            image,
          })),
        ),
      )
      .run();
    tx.insert(catalogItems)
      .values(items.map(([itemId, productId]) => ({ itemId, productId })))
      .run();
    tx.insert(catalogItemDetails)
      .values(
        items.flatMap(([itemId, , image, descriptions, attrs, prices]) =>
          LOCALES.map((locale, i) => ({
            itemId,
            locale,
            description: descriptions[i],
            image,
            attr1: attrs[i],
            listPrice: prices[i][0],
            unitCost: prices[i][1],
          })),
        ),
      )
      .run();
  });
}
