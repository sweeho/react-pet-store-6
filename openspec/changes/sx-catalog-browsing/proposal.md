## Why

The Java Pet Store 1.3.2 catalog (categories, products, items, keyword search and the storefront pages that show them) is being rebuilt. Its rules live in DDL, two interchangeable DAO classes, a SQL XML file and JSP pages, and are written down nowhere else. This change records that behaviour as a reviewable spec so the rebuild can be built and verified against it.

## What Changes

- Add the `catalog-browsing` capability: catalog data shape (category, product, item, per-locale details), locale scoping with no fallback, listing and lookup, paging, keyword search, the storefront catalog pages, page caching, anonymous access and failure reporting.
- Two screen requirements (home pet-selection screen, item detail screen) plus the category, product, search-results and navigation-panel displays.
- Records disputed in the IR (search case sensitivity, active DAO, unreachable keyword parser) are flagged in `design.md` and in `legacy-analysis/ir/_recommendations/catalog-browsing.yaml`; suspected legacy defects are listed for the Business Owner and are not specified as required behaviour.

## Capabilities

### New Capabilities

- `catalog-browsing`: browse, look up and search the pet catalog per locale, and display it on the storefront.

### Modified Capabilities

None.

## Impact

- Draft requirements only: no record of this capability is SME-approved, so `spec.md` carries no requirement keys.
- Touches neighbouring capabilities: Add to Cart hands off to the shopping cart; locale selection and the language switch belong to localization; unit price is what checkout charges.
