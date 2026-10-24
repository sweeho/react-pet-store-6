## Why

The Java Pet Store 1.3.2 catalog (categories, products, items, keyword search and the storefront pages that show them) is being rebuilt. Its rules live in DDL, two interchangeable DAO classes, a SQL XML file and JSP pages, and are written down nowhere else. This change records that behaviour as a reviewable spec so the rebuild can be built and verified against it.

## What Changes

- Add the `catalog-browsing` capability with its 17 SME-approved requirements: category, product and item data model and category codes; per-locale details and locale-scoped item visibility; category listing and paging defaults; keyword tokenizing and search; read paths and failure reporting; the shared 5-minute page cache; the home screen, category navigation panel, category product list and item detail page; and the home-to-item browse flow.
- The remaining records of this capability, including the item screen record CAT-SCR-0005, are not yet approved and are Not specified; `design.md` keeps the legacy notes behind them.
- Records disputed in the IR (search case sensitivity, active DAO, unreachable keyword parser) are flagged in `design.md` and in `legacy-analysis/ir/_recommendations/catalog-browsing.yaml`; suspected legacy defects are listed for the Business Owner and are not specified as required behaviour.

## Capabilities

### New Capabilities

- `catalog-browsing`: browse, look up and search the pet catalog per locale, and display it on the storefront.

### Modified Capabilities

None.

## Impact

- `spec.md` carries exactly the 17 approved requirement keys; pending records enter it only once approved.
- Touches neighbouring capabilities: Add to Cart hands off to the shopping cart; locale selection and the language switch belong to localization; unit price is what checkout charges.
