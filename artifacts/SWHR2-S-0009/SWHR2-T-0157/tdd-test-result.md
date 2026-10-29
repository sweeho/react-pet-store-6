---
ticket: SWHR2-T-0157
---

## Notes

Platform-recorded runs. Red: c41417fe-284d-4b71-9f27-78ee928a82fd (C-0183, C-0185, C-0188, C-0189 failed on stubs; C-0190 already passed because `getItem` was never cached). Green: recorded after the implementation commit (id in the ticket work comment).

Tests: `services/catalog/cache.test.ts`, `services/catalog/getitem-uncached.test.ts`, `routes/api/catalog/categories/[categoryId]/products.get.test.ts`, `routes/api/catalog/browse.get.test.ts`.
