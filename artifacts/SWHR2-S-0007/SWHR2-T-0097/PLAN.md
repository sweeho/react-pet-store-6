# SWHR2-T-0097 — Localization 3: Localized catalog and cart

Change `swhr2-i-0003-localization`. Read `design.md` first (Target design → Data; Legacy "Catalog and prices" and "Cart"; Spec discrepancies SD1–SD4).
Requirements: Catalog shown in the shopper's locale (SWHR2-R-0079), Cart lines follow the cart locale (SWHR2-R-0081); tasks 3.1–3.4.

## Objective

Locale-keyed catalog display details, seeded for en_US, ja_JP and zh_CN, read in the shopper's locale, and cart lines built from the cart's locale (en_US when none).

## Steps

1. `db/schema.ts`: tables `catalog_categories`, `catalog_category_details`, `catalog_products`, `catalog_product_details`, `catalog_items`, `catalog_item_details`, each `*_details` keyed by `(id, locale)`, column names exactly as `tests/acceptance/catalog-browsing/harness.ts` seeds them, plus item attribute columns (`attr1`…) on `catalog_item_details`. Generate the migration into `drizzle/` and commit it (task 3.1).
2. Seed (in `db/client.ts` alongside the existing demo seed, only when empty, never under Vitest) the FISH category, FI-SW-01 and EST-1 for all three locales with the legacy prices: EST-1 16.50 en_US, 1951 ja_JP, 142 zh_CN, as major-unit reals (task 3.2, SD3).
3. `services/catalog.ts`: `getItem(itemId, locale)` returning the item's product name, description, attributes and prices from that locale's rows. `routes/api/catalog/items/[itemId].get.ts` calls it with `requestLocale(event)` (task 3.3).
4. `services/cart.ts`: `addItem(cart: Map<string, number>, itemId)` and `lines(cart, locale?: string)` → lines with name, attribute and unit price from `getItem(id, locale ?? DEFAULT_LOCALE)` (task 3.4, SD4). `routes/api/cart/index.get.ts` and `routes/api/cart/items.post.ts` keep the cart on the session and call `lines` with the session locale.
5. `src/pages/petstore/cart.tsx`: list the lines from `GET /api/cart` with `formatMoney`, keeping the screen-definition text SWHR2-T-0095 wired in.

## File/module ownership

Modify: `db/schema.ts`, `db/client.ts`, `src/pages/petstore/cart.tsx`. Create: `drizzle/0001_*.sql` + `drizzle/meta/*`, `services/catalog.ts`, `services/cart.ts`, `routes/api/catalog/items/[itemId].get.ts`, `routes/api/cart/**`. Read-only: `services/locale.ts`, `shared/i18n/**`, `middleware/10.session.ts`. Out of scope: catalog search, category and item pages (catalog-browsing). Tests belong to SWHR2-T-0098.

## Design reference

No approved mockup applies to this ticket.

## Definition of Done

AC-1 to AC-4 on the ticket; SWHR2-C-0029, 0030, 0033 and 0034 in `tests/acceptance/localization/server.test.ts` pass.
