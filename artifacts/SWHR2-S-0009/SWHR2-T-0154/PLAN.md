# PLAN — SWHR2-T-0154 Catalog queries

Change `swhr2-i-0004-catalog-browsing-and-search`, tasks group 2. Read `design.md` first: §Target design → Components (Catalog service, Read paths), §Read paths, and §Planning → P2, P3, SD1.

## Objective

`services/catalog/` lists categories, products and items and looks up one category, product or item, each for exactly one locale, and reports store failures as `CatalogError`.

## Prior work to port

This group was built once as SWHR2-T-0143 (now cancelled) on `origin/vortex/feat/SWHR2-T-0143-catalog-queries-769bf669`, which forks from the cancelled SWHR2-S-0008 sprint branch. Port only its two own commits: `8bca9b8` (tests) and `705ad6e` (implementation). Do not merge that branch: it also carries S-0008's plan commit and stale `tasks.md` tags. Then confirm the result against this plan and its acceptance criteria.

## Steps

1. Move `services/catalog.ts` to `services/catalog/index.ts` (P2); `getItem` keeps its behaviour and also returns `productId` and `image`.
2. Add `listCategories(locale, start, size)` sorted by localized name, `listProducts(categoryId, locale, start, size)` sorted by product name, `listItems(productId, locale)`, and look-ups for a category and a product. Every item read inner-joins item details and product details on the same locale (SWHR2-R-0127). No locale fallback anywhere (tasks 2.5).
3. Wrap every store access so a thrown driver error becomes `CatalogError` (`name === "CatalogError"`) — never an empty list (tasks 2.6).
4. Data-access seam (P3): the service resolves its data-access implementation by a configured name from a registry (default: the Drizzle implementation) and exposes the configured dialect (`sqlite`). A test registers a recording double and proves AC-1 (cases SWHR2-C-0280, C-0281, C-0282).
5. Return list results in the `{ items, start, size, hasPrevious, hasNext }` envelope (paging arithmetic itself is SWHR2-T-0155; a simple slice is enough here).
6. Unit/integration tests in `services/catalog/*.test.ts` for AC-1..AC-9.

## File/module ownership

`services/catalog.ts` (deleted), `services/catalog/index.ts`, `services/catalog/data-access.ts` (new), `services/catalog/errors.ts` (new), `services/catalog/*.test.ts` (new; absorbs `services/catalog.test.ts`).

## Definition of Done

AC-1..AC-9 hold. Acceptance cases SWHR2-C-0193, C-0194, C-0195, C-0196, C-0203, C-0210, C-0211 in `tests/acceptance/catalog-browsing/reads.test.ts` pass. Cart lines and the item route behave as before the move.

## Design reference

This ticket changes no screen. The approved mockups are listed in `artifacts/SWHR2-S-0009/design/MANIFEST.md` for the screen ticket.
