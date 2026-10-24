# Catalog browsing: legacy implementation notes

How Java Pet Store 1.3.2 implements the behaviour in `specs/catalog-browsing/spec.md`. Paths are relative to `legacy-source/petstore1.3.2/`. This file describes the legacy system only; the target design is drafted separately once the Product Requirement is approved.

## Source of the records

50 IR records under `capability_key: catalog-browsing` were read from the pass files for `src/components/catalog` (a, b), `src/apps/petstore` (a, b), `src/waf` (a, b), `src/components/util` (a) and `docs` (a, b, c). Several record keys are reused across modules with different content (for example `CAT-ENT-0001`, `CAT-REQ-0001`..`0005`, `CAT-BR-0001`, `CAT-BR-0006`), so recommendations are listed per pass file. The server reports 26 ingested records and 2 screens. In the pass files, `CAT-SCR-0001` and `CAT-SCR-0002` both describe the home screen (`CAT-SCR-0002` adds the side panel), and `CAT-SCR-0005` describes the item screen. That gives two distinct screens. Neither screen record is approved yet, so both are Not specified in `spec.md`; only CAT-BR-0002 (SWHR2-R-0001) and CAT-INT-0001 (SWHR2-R-0002) are approved and specified. The notes below cover all records so the pending ones can be specified once approved.

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
