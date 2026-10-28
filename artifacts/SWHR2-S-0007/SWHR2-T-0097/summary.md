# SWHR2-T-0097 summary

- `db/schema.ts` + migration `drizzle/0001_glamorous_steve_rogers.sql`: six `catalog_*` tables, `*_details` keyed by `(id, locale)`, item details with `attr1..attr5`, prices as major-unit reals.
- `db/client.ts`: seeds FISH / FI-SW-01 / EST-1 in en_US, ja_JP, zh_CN (16.50, 1951, 142) when empty and not under Vitest.
- `services/catalog.ts` `getItem(id, locale)`; `services/cart.ts` `addItem`, `lines(cart, locale?)` (en_US when none), `cartFor(sessionId)`.
- Routes: `GET /api/catalog/items/[itemId]` (locale via `requestLocale`, 404 if absent), `GET /api/cart`, `POST /api/cart/items`.
- `src/pages/petstore/cart.tsx` lists the lines with `formatMoney`, else keeps the empty frame.
- Tests: `routes/api/catalog/items/item.test.ts` (C-0029/30/33/34), red/green recorded by the platform.
- Deviation: the item name returned is the locale's product name; the cart line name is the item description.
- Verification: `bun run lint`, `bun run typecheck`, `bun run test` (78 passed) exit 0; seed smoke-checked under bun outside Vitest.

CODE-REVIEW: self-review — sub-agent not run; checked locale-exact joins (no cross-locale fallback) and the sentinel-free services.
