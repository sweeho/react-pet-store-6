---
ticket: SWHR2-T-0155
---

# SWHR2-T-0155 Catalog paging

- `services/catalog/paging.ts` (new): `pageOf(rows, start = 0, size = 2)` with legacy arithmetic: `previousStart = max(start - count, 0)`, `nextStart = start + count`; negative start or no rows gives the empty page (start 0, no previous/next).
- `services/catalog/index.ts`: `page()` uses `pageOf`; negative start skips the store read; `listCategories` defaults to start 0, size 2; `listItems` also returns previous/next starts. `CatalogPage` now lives in paging.ts and is re-exported.
- AC-1 and AC-2: `paging.test.ts` [SWHR2-C-0186], [SWHR2-C-0187].
- Deviation: an out-of-range start now reports `start: 0, hasPrevious: false` (legacy EMPTY_PAGE) instead of echoing the start.

Verification: `bun run verify` passes (lint, typecheck, 109 tests). No screen change, so no design check.

CODE-REVIEW: self-review — small pure-function change; diff checked against PLAN steps 1-5.
