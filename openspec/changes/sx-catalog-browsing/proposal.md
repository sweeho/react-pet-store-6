## Why

The Java Pet Store 1.3.2 catalog (categories, products, items, keyword search and the storefront pages that show them) is being rebuilt. Its rules live in DDL, two interchangeable DAO classes, a SQL XML file and JSP pages, and are written down nowhere else. This change records that behaviour as a reviewable spec so the rebuild can be built and verified against it.

## What Changes

- Add the `catalog-browsing` capability with its two SME-approved requirements: keyword search (CAT-BR-0002, SWHR2-R-0001) and the catalog read paths with failure reporting (CAT-INT-0001, SWHR2-R-0002).
- The other 24 records of this capability, including both screen records (home pet-selection screen, item detail screen), are not yet approved and are Not specified; `design.md` keeps the legacy notes behind them for when they are.
- Records disputed in the IR (search case sensitivity, active DAO, unreachable keyword parser) are flagged in `design.md` and in `legacy-analysis/ir/_recommendations/catalog-browsing.yaml`; suspected legacy defects are listed for the Business Owner and are not specified as required behaviour.

## Capabilities

### New Capabilities

- `catalog-browsing`: browse, look up and search the pet catalog per locale, and display it on the storefront.

### Modified Capabilities

None.

## Impact

- `spec.md` carries exactly the two approved requirement keys; pending records enter it only once approved.
- Touches neighbouring capabilities: Add to Cart hands off to the shopping cart; locale selection and the language switch belong to localization; unit price is what checkout charges.
