# PLAN — SWHR2-T-0146 Catalog API and shared page cache

Change `swhr2-i-0004-catalog-browsing-and-search`, tasks group 5. Read `design.md` first: §Target design → Interfaces, Components → Page cache, §Caching, and §Planning → P7.

## Objective

Five unauthenticated catalog routes expose the service; category, product-list and item-list reads are served from a shared cache of at most 5 minutes; item detail and search are never cached; a store failure reaches the caller as a 500 catalog failure.

## Steps

1. `services/catalog/cache.ts`: a module-level TTL `Map` (300 000 ms, `Date.now()` based so fake timers drive it), keyed `(fn, locale, id, start, size)`; wrap `listCategories`, `listProducts` and `listItems` with it inside the service (P7). `getItem` and `search` stay uncached (tasks 5.6).
2. Routes (mirror `routes/api/catalog/items/[itemId].get.ts`; locale via `requestLocale`):
   - `routes/api/catalog/categories.get.ts` and `categories/[categoryId].get.ts` (tasks 5.1)
   - `routes/api/catalog/categories/[categoryId]/products.get.ts` and `products/[productId].get.ts` (tasks 5.2)
   - `routes/api/catalog/products/[productId]/items.get.ts`; keep `items/[itemId].get.ts` (tasks 5.3)
   - `routes/api/catalog/search.get.ts` reading `q` (tasks 5.4)
3. `start` / `size` query values parsed to integers, absent → service defaults. `CatalogError` → `HTTPError` status 500; unknown id → 404.
4. No auth middleware applies to `/api/catalog/**` (tasks 5.5); confirm against `middleware/`.
5. Integration tests per route with a real `H3Event` (mirror `routes/api/hello.test.ts`).

## File/module ownership

`services/catalog/cache.ts` (new), `services/catalog/index.ts` (cache wrapping only), `routes/api/catalog/**` (new route files and their `*.test.ts`).

## Definition of Done

AC-1..AC-5 hold. Acceptance cases SWHR2-C-0183, C-0185 (`reads.test.ts`) and C-0188, C-0189, C-0190 (`cache.test.ts`) pass.

## Design reference

This ticket changes no screen. The approved mockups are listed in `artifacts/SWHR2-S-0008/design/MANIFEST.md` for the screen ticket.
