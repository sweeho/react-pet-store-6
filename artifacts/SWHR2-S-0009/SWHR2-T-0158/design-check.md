# Design check: SWHR2-T-0158

No browser is installed in this container (`ensure-playwright-browser` reports Chromium missing), so no side-by-side screenshots were taken and none are saved under `design-check/`. The mockups were read from the canvas (SWHR2-MCK-8..12) and compared to the built markup by reading. Differences left:

## SWHR2-MCK-8 Home, `/petstore` and `/` (1440)

- Panel: the mockup lists categories as a sub-list of the rail; PLAN P4 requires one `complementary` landmark holding only the category links, so it is a column left of the page content.
- Pet map: an SVG picture with `<map>`/`<area>` regions, plus a label row per pet. The mockup's per-region product counts and illustrations are not built (no count API; picture is a placeholder asset).
- Tip cards from the mockup are not built.

## SWHR2-MCK-9 Category, `/petstore/category/DOGS` (1440)

- Two product cards per page with name, id, description, "View items", Previous/Next and a range note. Breadcrumb shows the category id, not its name, between Home and the page.
- Product pictures fall back to a placeholder: the seed's image files do not exist in `public/images/`.

## SWHR2-MCK-10 Product items, `/petstore/product/K9-BD-01` (1440)

- Summary card without the item count and category name (breadcrumb and summary show the category id). Table columns, prices and Add to Cart match.

## SWHR2-MCK-11 Item detail, `/petstore/item/EST-1` (1440)

- Image, List Price, Your Price, Add to Cart, Item ID and Product rows match. The Category row is omitted (the item API does not return it) and the product link replaces the "All <product>" button.

## SWHR2-MCK-12 Search, `/petstore/search?q=fish` (1440)

- Keyword chips, table and Add to Cart match. The Category column is omitted (not in the search result). The search box is in the app header (all screens), not a page-local bar.

Tokens: colours and spacing use the design system's Tailwind tokens, not the mockup's literals.
