## 1. Catalog data model

- [x] 1.1 Define the category entity with its id and per-locale name and description (SWHR2-T-0153; SWHR2-R-0037, SWHR2-R-0044, SWHR2-R-0046)
- [x] 1.2 Define the product entity with its category reference and per-locale name and description (SWHR2-T-0153; SWHR2-R-0037)
- [x] 1.3 Define the item entity with its product reference and per-locale list price, unit price, image, description and five attributes (SWHR2-T-0153; SWHR2-R-0037)
- [x] 1.4 Enforce field lengths, required fields, uniqueness per locale and parent references in the schema (SWHR2-T-0153; SWHR2-R-0037, SWHR2-R-0044, SWHR2-R-0045)
- [x] 1.5 Generate and commit the migration for the catalog tables (SWHR2-T-0153; SWHR2-R-0037)
- [x] 1.6 Seed the five storefront categories with products and items for the supported locales (SWHR2-T-0153; SWHR2-R-0039, SWHR2-R-0042, SWHR2-R-0047)

## 2. Catalog queries

- [x] 2.1 List categories for a locale ordered by localized name (SWHR2-T-0154; SWHR2-R-0038, SWHR2-R-0046)
- [x] 2.2 List products of a category for a locale ordered by localized name (SWHR2-T-0154; SWHR2-R-0039, SWHR2-R-0002)
- [x] 2.3 List items of a product for a locale, requiring the product's localization in the same locale (SWHR2-T-0154; SWHR2-R-0127)
- [x] 2.4 Look up a single category, product or item by id for a locale, returning nothing when absent (SWHR2-T-0154; SWHR2-R-0127, SWHR2-R-0043)
- [x] 2.5 Ensure no query falls back to another locale (SWHR2-T-0154; SWHR2-R-0043)
- [x] 2.6 Report store failures as errors rather than empty results (SWHR2-T-0154; SWHR2-R-0002)

## 3. Paging

- [ ] 3.1 Implement the page result with entries, next-page and previous-page indicators and their start positions (SWHR2-T-0155; SWHR2-R-0039)
- [ ] 3.2 Return an empty page for a negative start or a start beyond the last entry (SWHR2-T-0155; SWHR2-R-0035, SWHR2-R-0038)
- [ ] 3.3 Apply the default page size of 2 and start of 0 when no paging values are supplied (SWHR2-T-0155; SWHR2-R-0035)

## 4. Search

- [ ] 4.1 Split search text on whitespace into distinct keywords and short-circuit blank text (SWHR2-T-0156; SWHR2-R-0048, SWHR2-R-0001)
- [ ] 4.2 Match any keyword as a case-insensitive substring of product name, category id or item description (SWHR2-T-0156; SWHR2-R-0001)
- [ ] 4.3 Apply locale scoping and paging to search results (SWHR2-T-0156; SWHR2-R-0001, SWHR2-R-0127)

## 5. Catalog API

- [ ] 5.1 Expose category listing and category lookup endpoints (SWHR2-T-0157; SWHR2-R-0038)
- [ ] 5.2 Expose product listing and product lookup endpoints (SWHR2-T-0157; SWHR2-R-0039, SWHR2-R-0035, SWHR2-R-0002)
- [ ] 5.3 Expose item listing and item lookup endpoints (SWHR2-T-0157; SWHR2-R-0040, SWHR2-R-0047)
- [ ] 5.4 Expose the search endpoint (SWHR2-T-0157; SWHR2-R-0001)
- [ ] 5.5 Serve all catalog endpoints without authentication (SWHR2-T-0157; SWHR2-R-0002)
- [ ] 5.6 Add a shared cache of at most 5 minutes for category listing, product listing and category panel responses (SWHR2-T-0157; SWHR2-R-0036)

## 6. Storefront screens

- [ ] 6.1 Build the home screen with the pet selection picture linking to the five categories (SWHR2-T-0158; SWHR2-R-0041, SWHR2-R-0042)
- [ ] 6.2 Build the category navigation panel shown on every storefront page (SWHR2-T-0158; SWHR2-R-0042)
- [ ] 6.3 Build the category page with product rows and Previous/Next controls (SWHR2-T-0158; SWHR2-R-0039)
- [ ] 6.4 Build the product page with item rows, list price and Add to Cart (SWHR2-T-0158; SWHR2-R-0047)
- [ ] 6.5 Build the item detail screen with image, List Price, Your Price and Add to Cart (SWHR2-T-0158; SWHR2-R-0040)
- [ ] 6.6 Build the search box and the search results page with its no-results message (SWHR2-T-0158; SWHR2-R-0001)
- [ ] 6.7 Wire Add to Cart controls to the shopping cart (SWHR2-T-0158; SWHR2-R-0040, SWHR2-R-0047)
- [ ] 6.8 Return the shopper to the referring page after a language change (SWHR2-T-0158)

## 7. Verification

- [ ] 7.1 Unit-test paging arithmetic, keyword parsing and keyword matching (SWHR2-T-0159; SWHR2-R-0035, SWHR2-R-0048, SWHR2-R-0001)
- [ ] 7.2 Integration-test the catalog endpoints against seeded data, including locale gaps and unknown ids (SWHR2-T-0159; SWHR2-R-0002, SWHR2-R-0038, SWHR2-R-0127)
- [ ] 7.3 UI-test the home, category, product, item detail and search results screens (SWHR2-T-0159; SWHR2-R-0040, SWHR2-R-0041, SWHR2-R-0042)
- [ ] 7.4 End-to-end test browsing from home to item detail and adding to cart (SWHR2-T-0159; SWHR2-R-0047, SWHR2-R-0040)
