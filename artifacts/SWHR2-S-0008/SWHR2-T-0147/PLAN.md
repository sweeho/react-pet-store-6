# PLAN — SWHR2-T-0147 Storefront catalog screens

Change `swhr2-i-0004-catalog-browsing-and-search`, tasks group 6. Read `design.md` first: §Target design → SPA pages, Category side panel, §Pages (legacy rendering), and §Planning → P4, P5, P8, SD4, SD5, SD7.

## Objective

A shopper can start from the pet map or the category panel, page through a category two products at a time, open a product's items and an item's detail, search from the header, and add an item to the cart from the product, item and search screens.

## Steps

1. Screen text for every new screen comes from per-locale definitions in `src/locales/{en_US,ja_JP,zh_CN}/` registered in `src/locales/registry.ts` (ARCHITECTURE.md Key Decisions). Data loads through `useApi` with the shared Loading/Error/Empty frames; a catalog failure shows `ErrorFrame` with Try again.
2. `src/components/storefront/CategoryPanel.tsx`: `<aside>` with an accessible name, one link per category from `/api/catalog/categories` in the current locale, to `/petstore/category/<ID>` (tasks 6.2). Render it from `src/pages/petstore.tsx` so every storefront screen has it, and from `src/pages/index.tsx` (P5).
3. `src/components/shell/AppShell.tsx`: the rail's `<aside>` becomes a non-landmark container so the panel is the only `complementary` landmark (P4). Visual layout unchanged.
4. `src/components/storefront/PetMap.tsx`: image map (`<map>`/`<area>`) with regions Birds, Fish, Dogs, Reptiles, Cats → `/petstore/category/<ID>`; rendered by `src/pages/petstore/index.tsx` and `src/pages/index.tsx`, keeping the landing's existing cards (tasks 6.1). Image asset under `public/images/`.
5. `src/pages/petstore/category/[categoryId].tsx`: product names linking to `/petstore/product/<ID>`, two per page, position in `?start=`, Previous only when `hasPrevious`, Next only when `hasNext` (tasks 6.3).
6. `src/pages/petstore/product/[productId].tsx`: a table, one row per item with description, list price and an Add to Cart button (tasks 6.4).
7. `src/pages/petstore/item/[itemId].tsx`: image, "List Price" and "Your Price" (unit cost) formatted from hundredths, Add to Cart button (tasks 6.5).
8. Header search box in the storefront header slot posting to `/petstore/search?q=`; `src/pages/petstore/search.tsx` lists results with Add to Cart, or the no-results message (tasks 6.6).
9. Add to Cart posts `{ itemId }` to `POST /api/cart/items`; the cart page shows the item id beside each line's name (P8, tasks 6.7).
10. Language change keeps the shopper on the current storefront URL (SD4, tasks 6.8).
11. UI tests beside each new page/component (mirror `src/pages/index.test.tsx`); keep the site-shell and localization tests green.

## File/module ownership

`src/components/storefront/CategoryPanel.tsx`, `PetMap.tsx`, `SearchBox.tsx` (+ tests); `src/components/shell/AppShell.tsx`; `src/pages/index.tsx`; `src/pages/petstore.tsx`; `src/pages/petstore/index.tsx`, `category/[categoryId].tsx`, `product/[productId].tsx`, `item/[itemId].tsx`, `search.tsx`, `cart.tsx`, `change-language.tsx` (+ tests); `src/locales/**` (new screen definitions and registry entries); `public/images/**`.

## Definition of Done

AC-1..AC-8 hold. Acceptance cases SWHR2-C-0199 (`item-page.test.tsx`) and SWHR2-C-0197, C-0198, C-0200, C-0201, C-0202 (`e2e/browse.spec.ts`) pass. Each screen renders beside its mockup at 1440 px matching layout and content.

## Design reference

Approved mockups for SWHR2-I-0004 (doc v12, all at 1440 px): see `artifacts/SWHR2-S-0008/design/MANIFEST.md` for block ids and how to fetch them.

- SWHR2-MCK-8, Home screen: `/petstore` and `/`, pet map and category panel loaded
- SWHR2-MCK-9, Category product list: `/petstore/category/DOGS`, first page
- SWHR2-MCK-10, Product item list: `/petstore/product/<Bulldog product id>`
- SWHR2-MCK-11, Item detail: `/petstore/item/EST-1`
- SWHR2-MCK-12, Search results: `/petstore/search?q=fish`
