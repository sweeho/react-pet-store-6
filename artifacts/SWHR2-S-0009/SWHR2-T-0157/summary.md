---
ticket: SWHR2-T-0157
---

# SWHR2-T-0157 Catalog API and shared page cache

- `services/catalog/cache.ts` (new): process-wide TTL map, 5 minutes, `Date.now()` based; failures are not stored.
- `services/catalog/index.ts`: `listCategories`, `listProducts`, `listItems` go through the cache. Keys are `(impl, fn, locale, id, start, size)`; the configured `CATALOG_DATA_ACCESS` is part of the key so the C-0282 implementation switch still works. `getItem` and `search` are uncached.
- `services/catalog/http.ts` (new): query/path parsing, `CatalogError` to HTTP 500, 404 helper.
- Routes: `categories.get`, `categories/[categoryId].get`, `categories/[categoryId]/products.get`, `products/[productId].get`, `products/[productId]/items.get`, `search.get` (reads `q`, also `keyword` as the localization acceptance test uses it). No auth check applies; `middleware/auth.ts` only sets context.
- AC coverage: read-path agreement C-0183, failure C-0185, expiry C-0188, reuse C-0189, item detail uncached C-0190.
- Deviation: new helper `services/catalog/http.ts` is outside the plan's ownership list; it is shared by the routes only.

Verification: `bun run verify` passes (lint, typecheck, 129 tests). No screen change, so no design check.

CODE-REVIEW: self-review — checked cache keying, error mapping and 404 paths against PLAN steps 1-5.
