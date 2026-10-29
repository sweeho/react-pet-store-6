# SWHR2-T-0154 Catalog queries

Port of cancelled SWHR2-T-0143 (8bca9b8, 705ad6e); no deviation from PLAN.md.

- `services/catalog.ts` moved to `services/catalog/index.ts` (P2): `listCategories`, `listProducts`, `listItems`, `getCategory`, `getProduct`, `getItem` (also returns `productId`, `image`). One locale, no fallback; item reads inner-join item and product details on the locale. Lists return `{ items, start, size, hasPrevious, hasNext }` (simple slice; paging rules are SWHR2-T-0155).
- `errors.ts`: `CatalogError` wraps every store failure.
- `data-access.ts`: `DataAccess` interface, Drizzle implementation, registry. `CATALOG_DATA_ACCESS` (default `drizzle`) and `CATALOG_DB_DIALECT` (default `sqlite`) are read per call; unknown name or dialect mismatch throws `CatalogError`.
- `getItem`, `cart.lines`, the cart route and the item route are async; `services/cart.test.ts` updated.
- `search` is a placeholder returning `[]` so locked case C-0210 can call it; the search ticket replaces it.

AC-1..AC-9 are covered by cases C-0193..C-0196, C-0203, C-0210, C-0211, C-0280..C-0282. Locked list-route cases still fail until the later route ticket.

Verification: `bun run verify` passed (104 tests). E2E not run.

CODE-REVIEW: self-review — sub-agent not run; the code was reviewed in the original ticket and re-checked here against the plan; no findings.
