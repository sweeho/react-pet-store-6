---
ticket: SWHR2-T-0153
---

# SWHR2-T-0153 Catalog data model

Ported commit 64a48ca (cancelled S-0008) without its artifacts, then confirmed against the plan.

- `db/schema.ts`: foreign keys (details, product to category, item to product), `CHECK(length(category_id) <= 10)`, two indexes, `list_price`/`unit_cost` as not-null integers.
- `db/client.ts`: `PRAGMA foreign_keys = ON`, catalog tables in the schema object, five-category seed (never under Vitest, only when empty).
- `drizzle/0002_married_otto_octavius.sql` + meta; `db:generate` reports no further changes.
- Fixtures moved to hundredths; `cart.tsx` divides by 100 before `formatMoney`.
- AC-1..AC-6 covered by `services/catalog-schema.test.ts`. C-0192, C-0204, C-0205 already passed at red.

Verification: `bun run verify` — lint, typecheck, 27 files / 93 tests pass. No design check: no screen changes.

CODE-REVIEW: self-review — straight port of an already reviewed commit; diff checked against PLAN steps 1-6.
