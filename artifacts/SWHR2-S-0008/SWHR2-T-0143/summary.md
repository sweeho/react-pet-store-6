# SWHR2-T-0143 Catalog queries

- `services/catalog.ts` moved to `services/catalog/index.ts` (P2). New `listCategories`, `listProducts`, `listItems`, `getCategory`, `getProduct`; `getItem` now also returns `productId` and `image`. All reads are async, one locale, no fallback; items inner-join item and product details on the locale. List results use the `{ items, start, size, hasPrevious, hasNext }` envelope (simple limit+1 slice; paging rules are SWHR2-T-0144).
- `errors.ts`: `CatalogError`; every store failure is wrapped in it.
- `data-access.ts`: `DataAccess` interface, Drizzle implementation, registry. `CATALOG_DATA_ACCESS` (default `drizzle`) and `CATALOG_DB_DIALECT` (default `sqlite`) are read on each call; a mismatch or unknown name throws `CatalogError`. `catalogDialect()` reports the dialect.
- `getItem`, `cart.lines` and the cart and item routes are now async; callers and cart tests updated.
- `search` is a placeholder returning `[]` so locked case C-0210 can call it; SWHR2-T-0145 replaces it.

Deviation: none from PLAN.md. Locked C-0183 and C-0185 need the list route (later ticket) and still fail.

Verification: `bun run verify` passed (104 tests). Cases already passing before red: none.

CODE-REVIEW: self-review — sub-agent skipped; reviewed diff for locale scoping, error wrapping and async callers; no findings.
