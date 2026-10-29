---
ticket: SWHR2-T-0159
---

# Design check

Mockups were exported from the capability brief canvas (doc v12) and rendered at 1440x900 with the container's Chromium next to the built screens from the dev server on the seeded store. Pairs are in `design-check/` (`<screen>-mockup.png`, `<screen>-built.png`). This ticket adds no screen; the screens were built in SWHR2-T-0158, and I left every difference below as is (outside this ticket's ownership; changing the shell would risk the single-`complementary` landmark the acceptance suite relies on).

| Mockup                            | Route / state / viewport                                        | Pair                                        |
| --------------------------------- | --------------------------------------------------------------- | ------------------------------------------- |
| SWHR2-MCK-8 Home screen           | `/petstore`, 1440                                               | `home-mockup.png`, `home-built.png`         |
| SWHR2-MCK-9 Category product list | `/petstore/category/DOGS` (mockup shows Fish), first page, 1440 | `category-mockup.png`, `category-built.png` |
| SWHR2-MCK-10 Product item list    | `/petstore/product/K9-BD-01` (mockup shows Angelfish), 1440     | `product-mockup.png`, `product-built.png`   |
| SWHR2-MCK-11 Item detail          | `/petstore/item/EST-1`, 1440                                    | `item-mockup.png`, `item-built.png`         |
| SWHR2-MCK-12 Search results       | `/petstore/search?q=fish` (mockup shows "angel koi"), 1440      | `search-mockup.png`, `search-built.png`     |

## Differences left

- D1 (all screens): the built top bar has no Cart / Account / Sign in actions and shows EN/JA/ZH chips below it instead of the mockup's English / 日本語 / 中文 switch in the bar. The side navigation is the existing shell rail (Home, Catalog & search, Account, Administration) rather than the mockup's Shop / Catalog sub-list / Store staff with lock icons, and the footer lacks "Change language" and the locale label. Reason: shell belongs to site-shell/T-0158; not touched here.
- D2 (all screens): the category list is a separate "Categories" panel inside the content area (the single complementary landmark), not the mockup's sub-list under Catalog in the rail. Reason: acceptance case SWHR2-C-0201 expects one `complementary` landmark listing the five categories.
- D3 (home): the mockup has a "Welcome to Pet Store" heading, "Browse the catalog" button, category and product counts per tile, and two help cards; built shows "Catalog" with the intro line and the five tiles only. Tile order, the pet map, names and codes match.
- D4 (category, product, item, search): breadcrumbs differ (built "Home > DOGS", "Home > DOGS > Bulldog", "Home > Angelfish > Large Angelfish", "Home > Search"; mockup includes "Catalog" and the category name). Built omits the per-screen subtitle line on category, the "Back to ..." / "Items 2" / "Category" meta, the Category column and category chips on search, the result-count sentence and the footnotes.
- D5 (category): built tiles are shorter and show the dog's name and "View items" without the chevron icon; the mockup's tile image area is taller.
- D6 (all Add to Cart buttons): the cart icon touches the label in the built buttons (no gap); the mockup has a gap.
- D7 (sample data): mockup rows are fish (Angelfish, Fish, "angel koi"); built shows the seeded store for the route used, so names, counts and the search result differ. Prices match format ($16.50 / $10.00 from hundredths).
- D8 (search): the built search box does not carry the query ("angel koi" is shown in the mockup's focused box); built shows the query as a "fish" chip under the title.

These are candidates for a follow-up screen-polish ticket.
