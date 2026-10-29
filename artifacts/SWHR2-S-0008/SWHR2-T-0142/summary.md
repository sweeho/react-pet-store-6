# SWHR2-T-0142 Catalog data model

- `db/schema.ts`: foreign keys (details→parent, product→category, item→product), `CHECK(length(category_id) <= 10)`, indexes on `catalog_products(category_id)` and `catalog_items(product_id)`, `list_price`/`unit_cost` not-null integers (hundredths).
- `drizzle/0002_married_otto_octavius.sql` (+ meta): drizzle-kit table rebuilds; hand-edited to convert existing prices with `ROUND(x * 100)` so an existing dev db keeps correct values.
- `db/client.ts`: `PRAGMA foreign_keys = ON`, set after `migrate` (deviation from PLAN step 2: the migration drops and recreates referenced tables, which fails with enforcement on); catalog tables registered in the drizzle schema; seed replaced by the P6 fixture (5 categories ×3 locales, DOGS = Bulldog/Dalmation/Poodle, EST-1 at 1650/1000, 195100/155100, 14200/8600; FISH ja_JP "魚"). Runs only when empty and never under Vitest. Verified on a fresh db.
- Fixtures in `services/catalog.test.ts`, `services/cart.test.ts`, `routes/api/catalog/items/[itemId].get.test.ts` moved to hundredths; `src/pages/petstore/cart.tsx` divides by 100 before `formatMoney`.
- New `services/catalog-schema.test.ts` covers AC-1..AC-6 (cases C-0191, C-0192, C-0204, C-0205; C-0192/0204/0205 already passed at red).
- Seed bulldog items (EST-6, EST-7) and non-FISH image names are invented placeholders; SWHR2-I-0014 replaces the seed.
- No visible UI change beyond the cart price math, so no design-check.md.

Verification: `bun run verify` (lint, typecheck, unit) passed, 93 tests. E2E not run.

CODE-REVIEW: self-review — sub-agent not run; checked the diff against the PLAN and migration SQL; fixed the FK-vs-migration ordering and the data conversion; nothing rejected.
