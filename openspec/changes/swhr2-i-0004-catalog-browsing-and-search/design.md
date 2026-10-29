# Catalog browsing: legacy implementation notes

How Java Pet Store 1.3.2 implements the behaviour in `specs/catalog-browsing/spec.md`. Paths are relative to `legacy-source/petstore1.3.2/`. This file describes the legacy system only; the target design is drafted separately once the Product Requirement is approved.

## Source of the records

IR records under `capability_key: catalog-browsing` were read from the pass files for `src/components/catalog` (a, b), `src/apps/petstore` (a, b), `src/waf` (b), `src/components/util` (a) and `docs` (a, b, c). 17 records are approved and each is one requirement in `spec.md`; the rest are Not specified and carry a recommendation in `legacy-analysis/ir/_recommendations/catalog-browsing.yaml`. The two screen requirements are `CAT-SCR-0001` (home pet selection, `main.jsp`) and `CAT-SCR-0002` (home plus the category side panel, `main.jsp` and `sidebar.jsp`); the item screen record `CAT-SCR-0005` is pending, though approved `CAT-REQ-0005` already states the item detail page.

Several record keys are reused across pass files with different text. Where an approved key has more than one text, `spec.md` uses the text from the first pass file in path order (`docs` < `src/apps` < `src/components` < `src/waf`), and the other text is listed in the recommendations file for re-keying:

- `CAT-BR-0001`: catalog/a (item needs a localized product) is used; waf/b (`I18nUtil.parseKeywords`, no caller) is not.
- `CAT-ENT-0001`: apps/a (three-level hierarchy) is used; catalog/a (category field lengths) is not. Category id length and uniqueness are carried by `CATALOG-BROWSING-ENT-0001` and `CATALOG-BROWSING-ENTITY-0001`.
- `CAT-REQ-0001`: catalog/a (list categories) is used; util/a (compiled-out debug helper) is not.
- `CAT-REQ-0003`: apps/a (category product list with Previous/Next) is used; catalog/a (items of a product, no order) is not.
- `CAT-REQ-0005`: apps/a (item detail page) is used; catalog/a (catalog reads need no sign-on) is not.

If the SME approved the other text for any of these, the requirement under that ID must be rewritten from it.

## Data model

- DDL: `src/apps/petstore/src/docroot/populate/PopulateSQL.xml` (Cloudscape `char` and Oracle `varchar` variants). Tables `category`/`category_details`, `product`/`product_details`, `item`/`item_details`. Detail tables are keyed `(id, locale)` and have a foreign key to the parent. Item `listprice`/`unitcost` are `decimal(10,2) not null`, `image`/`descn` are not null, and `attr1..attr5` are nullable.
- `category_details.image` and `product_details.image` exist but the catalog component never reads them (`model/Category.java`, `model/Product.java` expose id, name and description only).
- `model/Item.java` also carries the category id and product name, joined from `product`/`product_details`. `getAttribute(n)` returns attribute 1 for any index outside 1..5 (CATB-ENT-0012). This accessor quirk is left out of the spec.
- Prices are read into Java `double` (suspected defect D4 below).
- `util/DatabaseNames.java` maps locales to per-locale tables (`product_ja`, `product_zh`) and has no caller. `JNDINames.USE_CATALOG_EJB` is never looked up. Both look like abandoned designs and are not specified.

## Read paths

- `client/CatalogHelper.java`: the default constructor, used by the JSPs as a session-scoped bean, reads directly through the DAO (Fast Lane Reader). `new CatalogHelper(false)`, used by the shopping cart EJB, goes through `ejb/CatalogEJB`: stateless, local interfaces, `Required` transaction on all seven read methods, `<unchecked/>` method permission in `ejb-jar.xml`.
- `dao/CatalogDAOFactory.java` instantiates the class named by `param/CatalogDAOClass`. This is either `CloudscapeCatalogDAO` (SQL hard-coded) or `GenericCatalogDAO`, which loads SQL from `src/apps/petstore/src/docroot/CatalogDAOSQL.xml` for the dialect named by `param/CatalogDAODatabase`. The `param/CatalogDAOClass` value is redacted in both `web.xml` and the catalog `ejb-jar.xml`, so which DAO runs in production cannot be settled from source.
- Queries: `GET_CATEGORIES ... where locale = ? order by name`; `GET_PRODUCTS ... where locale = ? and a.catid = ? order by name`; `GET_ITEMS` joins item, item_details, product_details and product with no `ORDER BY`; `GET_ITEM`, `GET_ITEMS` and `SEARCH_ITEMS` all join `b.locale = c.locale`. That inner join is why an item needs a localized product to be visible.
- Locale is bound as `Locale.toString()` (for example `en_US`). There is no fallback anywhere. The storefront JSPs hard-code `en_US` on the helper (`item.jsp`, `sidebar.jsp`, `search.jsp`); the locale itself belongs to the localization capability.
- Failures: `SQLException`/`NamingException` are turned into `CatalogDAOSysException`, which surfaces as `EJBException` on the EJB path and `CatalogException` on the helper path.

## Paging

- Every DAO list method calls `rs.absolute(start+1)` and then a do/while that reads up to `count` rows, with `hasNext` set from `rs.next()`. It returns `Page.EMPTY_PAGE` when `start < 0` or no row exists at `start`.
- `model/Page.java`: previous page is available when `start > 0`. The previous start is `max(start - objects.size(), 0)` and the next start is `start + objects.size()`.
- `CatalogHelper` defaults are `count = 2` and `start = 0`. `category.jsp`, `product.jsp` and `search.jsp` reset to 0/2 when no `count` parameter is present. The Previous link hard-codes `count=2`; the Next link passes `count=${pageResults.size}`.

## Search

- `banner.jsp` holds the keyword box and posts `keywords` to `search.screen`. `search.jsp` sets `catalog.searchQuery`.
- Both DAOs split the query with `java.util.StringTokenizer` (default whitespace delimiters) into a `HashSet`, which drops duplicates and loses order. An empty set returns `Page.EMPTY_PAGE` without a query.
- SQL: one group `(lower(name) like ? or lower(catid) like ? or lower(b.descn) like ?)` per keyword, OR-ed together, with each value wrapped as `%kw%`. The category **id** is searched, not the localized category name. There is no `ORDER BY`.
- Case: `CloudscapeCatalogDAO` lower-cases each keyword; `GenericCatalogDAO` binds it as typed. The spec states case-insensitive matching, which is the evident intent of the lower-cased columns. This is disputed (CAT-BR-0002, CATB-RULE-0010) and goes to Intent.
- `waf/util/I18nUtil.parseKeywords` (BreakIterator word tokenizer) has no caller in the tree (waf/b CAT-BR-0001), so it is not the tokenizer the catalog uses.

## Pages (legacy rendering)

| Spec requirement          | Legacy page                                        | Notes                                                                          |
| ------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------ |
| Home screen pet selection | `main.jsp` (`splash.gif` image map)                | Six areas; BIRDS appears twice. Links go to `category.screen?category_id=<ID>` |
| Category navigation panel | `sidebar.jsp`, included by every screen definition | `count=5`, `start=0`, locale `en_US`                                           |
| Category page display     | `category.jsp`                                     |                                                                                |
| Product page display      | `product.jsp`                                      | Shows `item.listCost`                                                          |
| Item detail screen        | `item.jsp` (`item.screen?item_id=`)                | `listCost` labelled "List Price", `unitCost` labelled "Your Price"             |
| Search results display    | `search.jsp`                                       | Shows `item.unitCost`                                                          |
| Add to Cart (all pages)   | link to `cart.do?action=purchase&itemId=<id>`      | Cart behaviour belongs to the shopping-cart capability                         |

## Caching

`<waf:cache scope="context" duration="300000">` wraps `category.jsp` (name `page`), `product.jsp` (`product_en_US`) and `sidebar.jsp` (`sidebar_en_US`). `waf/.../taglibs/smart/CacheTag.java` keys entries by `requestURL#name?queryString` in application scope and discards an entry once its age exceeds the duration. The ja/zh copies of the pages cache the product page and the side panel only. `item.jsp` and `search.jsp` are not cached.

## Navigation state

`waf/.../template/TemplateServlet.java` stores the current screen in session `PREVIOUS_SCREEN` and serves `PREVIOUS.screen` from it. `cache_previous_screen_*` is false, so parameters are not replayed on that path. `ClientStateTag` writes the current request parameters and attributes into hidden fields plus `referring_screen`. `ClientStateFlowHandler`, used by `changelocale.do` (`WEB-INF/mappings.xml`), restores them and forwards to the referring screen. The IR filed this record (CAT-WF-0009) here, but it overlaps localization.

## Suspected legacy defects (for the Business Owner's defect register)

None of these is specified as required behaviour. Whether each one is a defect is for the Business Owner to decide.

- D1. Search with an upper-case keyword matches nothing on the `GenericCatalogDAO` path (`GenericCatalogDAO.java` 359-365 vs `CloudscapeCatalogDAO.java` 391-394).
- D2. The item list swaps category id and product id on every item (`GenericCatalogDAO.java` 319-323, `CloudscapeCatalogDAO.java` 317-321). This is latent because no page reads those fields.
- D3. `CloudscapeCatalogDAO` trims a product's description in category listings, which fails on a NULL description and aborts the page (lines 238-240). The schema allows NULL.
- D4. Exact `decimal(10,2)` prices are carried as `double`.
- D5. The previous-page start is computed from the current page's entry count, not the page size, so a short last page leads to overlapping pages (`Page.java` 89-91). The spec keeps the legacy formula; the Business Owner should decide whether to keep it.
- D6. A page size of 0 or less still returns one entry (do/while in `GenericCatalogDAO.java` 197-201). Not specified.
- D7. `CloudscapeCatalogDAO` closes its connection only on the success path, so every failed query leaks a connection. `GenericCatalogDAO` swallows close errors and ignores malformed SQL configuration (lines 425-428, 583-586).
- D8. The product page shows list price while search results show unit price, so the same item appears at two prices depending on how the shopper found it (apps/petstore a suspected defect).
- D9. Errors in the WAF keyword parser are discarded silently because `util/tracer/Debug.java` is compiled with `debuggingOn = false` (util/b). The parser itself appears unreachable (see Search).

## Target design

### Components

- **Catalog service** `services/catalog/index.ts`. This module is the only reader of the catalog tables. It provides:
  - `listCategories(locale, start, size)`, sorted by localized name (SWHR2-R-0038).
  - `listProducts(categoryId, locale, start = 0, size = 2)`, sorted by product name (SWHR2-R-0035, SWHR2-R-0039).
  - `listItems(productId, locale)`.
  - `getItem(itemId, locale)`.
  - `search(text, locale)`.

  Every read joins the item's details and its product's details on the same locale, so an item is returned only where both are localized (SWHR2-R-0127). A failure to reach or query the store throws a `CatalogError`, which the API reports to the caller as a catalog failure (500) rather than an empty or partial list (SWHR2-R-0002.03).

- **Read paths** (SWHR2-R-0002). The `/api/catalog/*` routes are the read path used by the SPA. Server components that need catalog data (cart lines, My List, checkout pricing) call the catalog service in-process. Both paths run the same service functions, so they return the same data. The target has one data-access implementation (Drizzle) and one dialect (SQLite), selected in `db/client.ts` and `drizzle.config.ts`. A configurable choice between several implementations and dialects is not built, because the PRD constraints pin a single datastore.
- **Search** in `services/catalog/search.ts`:
  - It splits the text on whitespace (space, tab, line break, form feed) and drops duplicate keywords. If no keyword remains, it returns `[]` without a query (SWHR2-R-0001.05, SWHR2-R-0048).
  - It returns each item, in the locale, for which any keyword is a case-insensitive substring of the product name, the category id or the item description (SWHR2-R-0001). This uses Drizzle `like` with `%` and `_` escaped, OR-ed across keywords and fields, and each item is returned once.
- **Page cache** `services/catalog/cache.ts` (SWHR2-R-0036): an in-process TTL map with a 5-minute TTL, shared by all shoppers. It holds the results of the category product list, the product item list and the category side panel, keyed by `(endpoint, locale, id, start, size)`. Item detail and search are never cached.
- **SPA pages** under `src/pages/petstore/`:
  - `index.tsx`, the Home screen: a pet selection image map with regions for Birds, Fish, Dogs, Reptiles and Cats, each linking to its category page (SWHR2-R-0041, SWHR2-R-0042). site-shell also renders this component at `/`.
  - `category/[categoryId].tsx`: product names, two per page, with Previous shown only when an earlier page exists and Next only when a later one exists. The position is kept in the `start` query parameter (SWHR2-R-0039).
  - `product/[productId].tsx`: the item rows, each with Add to Cart (SWHR2-R-0047).
  - `item/[itemId].tsx`: image, "List Price", "Your Price" (the unit cost) and Add to Cart (SWHR2-R-0040).
  - `search.tsx`: the search results, each addable to the cart.
- **Category side panel** `src/components/storefront/CategoryPanel.tsx`: rendered by the storefront layout on every storefront screen. It lists categories in the current locale by name, each linking to its category page (SWHR2-R-0042).
- Add to Cart controls call the shopping-cart API (shopping-cart SWHR2-R-0144).

### Data

These tables are in `db/schema/storefront.ts`, and building them produces one new drizzle-kit migration in `drizzle/`. The schema enforces SWHR2-R-0037.

- `catalog_categories`: `category_id` text primary key, not null, with `CHECK(length(category_id) <= 10)` (SWHR2-R-0044, SWHR2-R-0045).
- `catalog_category_details`: `(category_id, locale)` primary key, with `name`, `description` and `image`. `category_id` references `catalog_categories`.
- `catalog_products`: `product_id` primary key and `category_id`, not null, referencing `catalog_categories`. A product with an unknown category is rejected (SWHR2-R-0037.01).
- `catalog_product_details`: `(product_id, locale)` primary key, with `name`, `description` and `image`.
- `catalog_items`: `item_id` primary key and `product_id`, not null, referencing `catalog_products`.
- `catalog_item_details`: `(item_id, locale)` primary key, with `description`, `image`, the item attribute text fields, and `list_price` and `unit_cost` as not-null integers (SWHR2-R-0037.02). Money is held in hundredths of the displayed unit in every locale: 16.50 is stored as 1650, and ¥1951 as 195100.
- Indexes on `catalog_products(category_id)` and `catalog_items(product_id)`.
- SQLite foreign keys are enabled (`PRAGMA foreign_keys = ON`) in `db/client.ts`, so the references are enforced.

### Interfaces

All routes take an optional `locale` query parameter (localization) and need no authorisation, because catalog reads are open to visitors. Lists are returned as `{ items: [...], start, size, hasPrevious, hasNext }`.

- `GET /api/catalog/categories?start&size` (cached)
- `GET /api/catalog/categories/[categoryId]/products?start&size`, with defaults start 0 and size 2 (cached)
- `GET /api/catalog/products/[productId]/items` (cached)
- `GET /api/catalog/items/[itemId]`, which returns 404 when the item is not visible in the locale (not cached)
- `GET /api/catalog/search?q=` (not cached)

### Stack choices

- Nitro (H3) file-based routes under `routes/api/catalog/`, and Drizzle ORM over SQLite through `drizzle-orm/bun-sqlite`, the driver this repository already uses (the PRD names better-sqlite3; the repository's `db/client.ts` uses `bun:sqlite`, which the Bun runtime requires). Schema check constraints use Drizzle's sqlite-core `check()`.
- An in-process `Map` cache, valid because the server runs as a single process (`ecosystem.config.js`, `instances: 1`). No external cache is added.
- Vite React SPA pages under `src/pages/petstore/`. The pet map is a `<map>`/`<area>` image map in the page component.
- Tests: `routes/api/catalog/*.test.ts` integration tests against the in-memory database, UI tests for the four pages and the side panel, and a Playwright browse-to-item spec.

## Planning (sprint SWHR2-S-0008)

Added at sprint planning. The sections above are the adopted specification and are unchanged; this section records what the repository already holds, the decisions that resolve conflicts between it and the target design, and the delivery phases.

### Codebase findings

- **Already built by localization (change `swhr2-i-0003-localization`)**: the six catalog tables in `db/schema.ts` (migration `drizzle/0001_glamorous_steve_rogers.sql`), `services/catalog.ts#getItem` (inner-joins item and product details on one locale, so SWHR2-R-0127 already holds for look-ups), `GET /api/catalog/items/[itemId]` (404 when not visible), and a one-item seed (FISH / FI-SW-01 / EST-1, three locales) in `db/client.ts`. Locale resolution is `services/locale.ts#requestLocale`; money formatting is `shared/i18n/format.ts#formatMoney` (major units in).
- **Not yet built**: category/product listing, item listing, paging, search, the page cache, every list route, every storefront catalog screen, the category panel, the search box.
- **Schema gaps against SWHR2-R-0037 / R-0044 / R-0045**: no foreign keys and no `PRAGMA foreign_keys = ON` (SQLite ignores references without it); no `CHECK(length(category_id) <= 10)`. `category_id` is already `PRIMARY KEY NOT NULL`, so duplicate and missing codes are already refused.
- **Cart**: `services/cart.ts` (session-keyed in-memory map, `addItem`, `lines`) and `POST /api/cart/items` `{ itemId }` exist; `src/pages/petstore/cart.tsx` lists the lines. Add to Cart wires to that route.
- **Shell**: `src/components/shell/AppShell.tsx` renders the global navigation rail inside an `<aside>`; `src/pages/petstore.tsx` is the storefront layout (`LocaleProvider`, `LanguageFlags`, `<Outlet/>`); `src/pages/index.tsx` is the site-shell landing at `/`; `src/pages/petstore/index.tsx` is a placeholder screen.
- **Acceptance suite** (`tests/acceptance/catalog-browsing/`, red until built) fixes the interfaces: `services/catalog` exports `listCategories`, `listProducts(categoryId, locale, start?, size?)`, `listItems`, `getItem`, `search` and a `CatalogError` (`name === "CatalogError"`); route modules `routes/api/catalog/categories/[categoryId]/products.get.ts` etc.; page module `src/pages/petstore/item/[itemId].tsx`; seeds raw SQL into the target table and column names; prices in hundredths (1650 → "16.50"); the e2e specs expect URLs `/petstore/category/<ID>`, `/petstore/product/<ID>`, `/petstore/item/<ID>`, one `complementary` landmark holding exactly the category links, and the category panel on `/`.
- **CI**: `.github/workflows/ci.yml` already runs `test:acceptance` and `test:acceptance:e2e` (with `continue-on-error`, because other capabilities' suites are still red) and triggers on `vortex/**`. No workflow change is needed for this capability.

### Planning decisions

- **P1. Money in hundredths, as this change's Data section says.** `list_price` / `unit_cost` become not-null integers holding hundredths of the displayed unit (16.50 → 1650, ¥1951 → 195100, ¥142 → 14200). This supersedes localization's SD3 (major-unit reals): the acceptance suites of this capability and of shopping-cart both seed 1650 and expect 16.50. Consumers divide by 100 before calling `formatMoney`, which keeps taking major units. The column type change is one new drizzle-kit migration; existing fixtures in `services/*.test.ts` and `routes/api/catalog/items/[itemId].get.test.ts` move to hundredths in the same ticket.
- **P2. `services/catalog.ts` becomes `services/catalog/index.ts`.** A file and a directory of the same name cannot coexist, and every importer (`services/cart.ts`, the item route, the harness) resolves either form, so no importer changes.
- **P3. Data access selected by configuration (SWHR2-R-0002.02) is built as a thin seam, not as multiple back-ends.** The approved cases SWHR2-C-0280/0281/0282 require that the configured implementation serves reads and that the dialect in use is the configured one. The catalog service resolves its data-access implementation from a registry by a configured name (default the Drizzle implementation) and reports the dialect `sqlite`; tests register a recording double. No second real implementation or dialect is built (see Spec discrepancies SD1).
- **P4. Category panel and shell landmark.** The panel is the page's only `complementary` landmark (`<aside aria-label=…>`). The shell's navigation rail stops being an `<aside>` (a `div` around its existing `<nav>`), so `getByRole("complementary")` resolves to the panel alone. Visual layout of the rail is unchanged.
- **P5. `/` keeps the site-shell landing and gains the pet map and category panel.** The pet selection map component lives in `src/components/storefront/PetMap.tsx`; `src/pages/petstore/index.tsx` and `src/pages/index.tsx` both render it with `CategoryPanel`. The landing's area cards and catalog call to action stay, so the site-shell tests keep passing.
- **P6. Seed fixture.** `db/client.ts` seeds (outside Vitest, when empty) the spec's fixture: five categories BIRDS, CATS, DOGS, FISH, REPTILES in en_US/ja_JP/zh_CN; DOGS with exactly Bulldog, Dalmation, Poodle; Bulldog items including "Male Adult Bulldog"; FISH with FI-SW-01 Angelfish and EST-1 at 16.50 / 10.00. The legacy full sample (16 products, 28 items) stays with sample data population (SWHR2-I-0014), which replaces this seed.
- **P7. Cache placement.** The 5-minute TTL map sits inside the service functions `listCategories`, `listProducts` and `listItems` (the cache acceptance cases call the service, not the route), keyed `(fn, locale, id, start, size)`, reading `Date.now()` so fake timers drive it. `getItem` and `search` bypass it.
- **P8. Add to Cart** posts `{ itemId }` to `POST /api/cart/items` and then shows the cart count change; the cart page must show the item id beside its name (SWHR2-C-0200 looks for "EST-1" on the cart page).

### Spec discrepancies

- **SD1. SWHR2-R-0002 (configurable implementation and dialect) vs Target design "Read paths".** The requirement and its approved cases C-0280..C-0282 require deployment-configured selection; the target design says it is not built. Resolved by P3 (a seam with one real implementation). Business Owner to confirm the seam is sufficient.
- **SD2. Money units.** The target design's hundredths contradicts localization's shipped SD3 (major-unit reals). Resolved by P1 in favour of this change.
- **SD3. Seed vs Out of Scope.** The brief puts loading the sample catalog out of scope, yet task 1.6 seeds categories, products and items, and the e2e cases need DOGS with exactly 3 products. The legacy sample has 6 dogs, so when SWHR2-I-0014 loads it, SWHR2-C-0197/0198 (which assume 3) will no longer hold against the seeded store. Resolved for this sprint by P6; flagged for SWHR2-I-0014 planning.
- **SD4. Task 6.8 (return to the referring page after a language change) has no requirement in this change.** Return-to-page was recorded as Not specified in localization (its SD6). The line is tagged with its ticket but no requirement; built as the minimum (the language switch preserves the current storefront URL).
- **SD5. SWHR2-R-0041 / R-0042 say "main page"**; the repository's `/` is the site-shell landing and the storefront home is `/petstore`. The e2e cases open the panel from `/`. Resolved by P5.
- **SD6. No test cases** exist for SWHR2-R-0041 (home pet selection), SWHR2-R-0045 (category id length) and SWHR2-R-0046 (localized category names). Their acceptance criteria are still carried by the owning tickets and covered by the tickets' own tests.
- **SD7. Shell landmark.** The shell's `<aside>` rail contradicts the e2e's single-`complementary` assumption. Resolved by P4.

### Phases

Each phase is one ticket, in this order; each depends on the one before, because every phase extends `services/catalog/` or builds on its routes.

1. **Catalog data model**: schema constraints, foreign keys, hundredths, migration, seed fixture (tasks 1.x).
2. **Catalog queries**: service module move, list/look-up functions, locale scoping, `CatalogError`, data-access seam (tasks 2.x).
3. **Paging**: page result and defaults (tasks 3.x).
4. **Search**: tokenizer and keyword match (tasks 4.x).
5. **Catalog API**: the five routes, unauthenticated, plus the 5-minute cache (tasks 5.x).
6. **Storefront screens**: home pet map, category panel, category / product / item / search pages, Add to Cart, header search box (tasks 6.x).
7. **Verification (test harness)**: the browse-to-cart end-to-end flow and the remaining unit, integration and UI coverage; the catalog-browsing acceptance suite (Vitest and Playwright) is green (tasks 7.x).
8. **CI**: no workflow change. The existing CI runs the catalog-browsing acceptance suites on every `vortex/**` push; they stay under `continue-on-error` until every capability's suite is green, so phase 7's ticket shows them green in its CI run rather than flipping the flag.
