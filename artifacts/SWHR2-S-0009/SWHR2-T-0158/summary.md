# SWHR2-T-0158 Storefront catalog screens

- New in `src/components/storefront/`: `CategoryPanel` (the only `complementary` landmark, loads `/api/catalog/categories`), `PetMap` (image map plus label links to `/petstore/category/<ID>`), `SearchBox` (header, opens `/petstore/search?q=`), `AddToCart` (POST `/api/cart/items`, status text), `ApiView` (Loading/Error frames over `useApi`), `CatalogImage` (placeholder on a missing file), `catalogApi.ts` (types, URL builder, money from hundredths).
- Pages: category (two per page, `?start=`, Previous/Next only when the API says so), product item table, item detail, search results (10 per page). Text in new `catalog` screen definitions for en_US, ja_JP and zh_CN; `petstore-home` messages updated.
- `AppShell`: the rail is a `div` (P4), header shows `SearchBox` unless a header is passed, root is `h-screen` so the taller `/` scrolls inside `main` (keeps the "no vertical scrollbar" E2E). `petstore.tsx` and `index.tsx` render the panel; both homes render the map. `cart.tsx` shows the item id beside each line (P8).
- Outside the listed files: `routes/api/catalog/search.get.ts` now passes `start`/`size` (without it the page could never show more than 2 results); `db/client.ts` seed gives products real descriptions (a description equal to the name made `getByText("Bulldog")` match twice).
- SD4 (language change keeps the URL) already holds: the flags and the change-language page do not navigate.
- Design differences are in `design-check.md`; no screenshots (no browser here).

AC-1..AC-8 covered by cases C-0197..C-0202. Verification: `bun run verify` passed (141 tests), `bun run build` passed. E2E not run (no Chromium).

CODE-REVIEW: self-review — sub-agent not run; checked landmark uniqueness, locale scoping of every fetch and the Add to Cart request body; no findings.
