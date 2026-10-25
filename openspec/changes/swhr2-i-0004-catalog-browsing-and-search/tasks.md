## 1. Catalog data model

- [ ] 1.1 Define the category entity with its id and per-locale name and description
- [ ] 1.2 Define the product entity with its category reference and per-locale name and description
- [ ] 1.3 Define the item entity with its product reference and per-locale list price, unit price, image, description and five attributes
- [ ] 1.4 Enforce field lengths, required fields, uniqueness per locale and parent references in the schema
- [ ] 1.5 Generate and commit the migration for the catalog tables
- [ ] 1.6 Seed the five storefront categories with products and items for the supported locales

## 2. Catalog queries

- [ ] 2.1 List categories for a locale ordered by localized name
- [ ] 2.2 List products of a category for a locale ordered by localized name
- [ ] 2.3 List items of a product for a locale, requiring the product's localization in the same locale
- [ ] 2.4 Look up a single category, product or item by id for a locale, returning nothing when absent
- [ ] 2.5 Ensure no query falls back to another locale
- [ ] 2.6 Report store failures as errors rather than empty results

## 3. Paging

- [ ] 3.1 Implement the page result with entries, next-page and previous-page indicators and their start positions
- [ ] 3.2 Return an empty page for a negative start or a start beyond the last entry
- [ ] 3.3 Apply the default page size of 2 and start of 0 when no paging values are supplied

## 4. Search

- [ ] 4.1 Split search text on whitespace into distinct keywords and short-circuit blank text
- [ ] 4.2 Match any keyword as a case-insensitive substring of product name, category id or item description
- [ ] 4.3 Apply locale scoping and paging to search results

## 5. Catalog API

- [ ] 5.1 Expose category listing and category lookup endpoints
- [ ] 5.2 Expose product listing and product lookup endpoints
- [ ] 5.3 Expose item listing and item lookup endpoints
- [ ] 5.4 Expose the search endpoint
- [ ] 5.5 Serve all catalog endpoints without authentication
- [ ] 5.6 Add a shared cache of at most 5 minutes for category listing, product listing and category panel responses

## 6. Storefront screens

- [ ] 6.1 Build the home screen with the pet selection picture linking to the five categories
- [ ] 6.2 Build the category navigation panel shown on every storefront page
- [ ] 6.3 Build the category page with product rows and Previous/Next controls
- [ ] 6.4 Build the product page with item rows, list price and Add to Cart
- [ ] 6.5 Build the item detail screen with image, List Price, Your Price and Add to Cart
- [ ] 6.6 Build the search box and the search results page with its no-results message
- [ ] 6.7 Wire Add to Cart controls to the shopping cart
- [ ] 6.8 Return the shopper to the referring page after a language change

## 7. Verification

- [ ] 7.1 Unit-test paging arithmetic, keyword parsing and keyword matching
- [ ] 7.2 Integration-test the catalog endpoints against seeded data, including locale gaps and unknown ids
- [ ] 7.3 UI-test the home, category, product, item detail and search results screens
- [ ] 7.4 End-to-end test browsing from home to item detail and adding to cart
