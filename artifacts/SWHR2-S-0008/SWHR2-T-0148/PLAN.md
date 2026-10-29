# PLAN — SWHR2-T-0148 Catalog browse-to-cart verification

Change `swhr2-i-0004-catalog-browsing-and-search`, tasks group 7. Read `design.md` first: §Planning → Phases 7 and 8.

## Objective

The browse-from-home-to-cart journey is proven end to end, and the capability's own unit, integration and UI coverage is complete against the seeded store.

## Steps

1. Unit coverage for paging arithmetic, keyword parsing and keyword matching is present; add any gap (tasks 7.1).
2. Integration tests for every `/api/catalog/*` route against seeded data, including a locale with no details and an unknown id (tasks 7.2).
3. UI tests for the home, category, product, item detail and search results screens (tasks 7.3).
4. `e2e/catalog.spec.ts`: home → Dogs → Bulldog → items listed with Add to Cart → add "Male Adult Bulldog" → it is on the cart page (tasks 7.4). Run it before committing.
5. Fix in place any defect these tests expose in code from SWHR2-T-0142..T-0147.
6. CI: no workflow change; the catalog-browsing acceptance suites (Vitest and Playwright) show green in this ticket's CI run.

## File/module ownership

`e2e/catalog.spec.ts` (new); new or extended `*.test.ts(x)` beside catalog code under `services/catalog/`, `routes/api/catalog/`, `src/pages/petstore/`, `src/components/storefront/`; defect fixes in those modules.

## Definition of Done

AC-1 and AC-2 hold. Acceptance cases SWHR2-C-0206 and C-0207 in `tests/acceptance/catalog-browsing/e2e/browse.spec.ts` pass, and every case in `tests/acceptance/catalog-browsing/` passes.

## Design reference

Approved mockups for SWHR2-I-0004 (doc v12, all at 1440 px): see `artifacts/SWHR2-S-0008/design/MANIFEST.md` for block ids and how to fetch them.

- SWHR2-MCK-8, Home screen: `/petstore` and `/`, pet map and category panel loaded
- SWHR2-MCK-9, Category product list: `/petstore/category/DOGS`, first page
- SWHR2-MCK-10, Product item list: `/petstore/product/<Bulldog product id>`
- SWHR2-MCK-11, Item detail: `/petstore/item/EST-1`
- SWHR2-MCK-12, Search results: `/petstore/search?q=fish`
