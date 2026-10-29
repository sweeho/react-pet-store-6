# PLAN — SWHR2-T-0153 Catalog data model

Change `swhr2-i-0004-catalog-browsing-and-search`, tasks group 1. Read `design.md` first: §Target design → Data, and §Planning → P1, P6, SD2, SD3.

## Objective

The catalog schema enforces the hierarchy, category-code and category-id rules, holds prices in hundredths, and a fresh store is seeded with the spec's five-category fixture.

## Prior work to port

This group was built and merged once, as SWHR2-T-0142, into the cancelled sprint SWHR2-S-0008. It never reached `dev`. Commit `64a48ca` on `origin/vortex/sprint/swhr2-s-0008-0b69a563` implements every step below: the schema, foreign keys, hundredths, migration `drizzle/0002_married_otto_octavius.sql`, the seed fixture and the moved fixtures. Port its code files and leave out its `artifacts/SWHR2-S-0008/**` files. Then confirm the result against this plan and its acceptance criteria rather than assuming them.

## Steps

1. `db/schema.ts`: add the references from §Data (details → parent, product → category, item → product), the `CHECK(length(category_id) <= 10)` on `catalog_categories`, the two indexes, and change `list_price` / `unit_cost` to not-null integers (P1). Keep every table and column name: the acceptance harness seeds them by raw SQL.
2. `db/client.ts`: enable `PRAGMA foreign_keys = ON` on the connection before migrating; register the catalog tables in the drizzle schema object.
3. Generate the migration (one new file in `drizzle/` plus its meta) and commit it.
4. Replace the one-item seed with the P6 fixture (BIRDS, CATS, DOGS, FISH, REPTILES × en_US/ja_JP/zh_CN; DOGS = Bulldog, Dalmation, Poodle; Bulldog items include "Male Adult Bulldog"; FISH/FI-SW-01/EST-1 at 1650/1000 en_US, 195100/155100 ja_JP, 14200/8600 zh_CN). ja_JP FISH category name is "魚". Seed only when the catalog is empty and never under Vitest.
5. Move existing price fixtures to hundredths: `services/catalog.test.ts`, `services/cart.test.ts`, `routes/api/catalog/items/[itemId].get.test.ts`; make `src/pages/petstore/cart.tsx` divide by 100 before `formatMoney`.
6. Add a schema test that covers AC-1..AC-6 (mirror `services/catalog.test.ts`).

## File/module ownership

`db/schema.ts`, `db/client.ts`, `drizzle/0002_*.sql`, `drizzle/meta/*`, `services/catalog.test.ts`, `services/cart.test.ts`, `routes/api/catalog/items/[itemId].get.test.ts`, `src/pages/petstore/cart.tsx`, new `services/catalog-schema.test.ts`.

## Definition of Done

AC-1..AC-6 hold. The acceptance cases SWHR2-C-0191, C-0192, C-0204, C-0205 in `tests/acceptance/catalog-browsing/schema.test.ts` pass. The localization and cart pages still show en_US 16.50, ja_JP ¥1,951 and zh_CN 142 for EST-1.

## Design reference

This ticket changes no screen. The approved mockups are listed in `artifacts/SWHR2-S-0009/design/MANIFEST.md` for the screen ticket.
