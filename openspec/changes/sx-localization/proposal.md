# Proposal: Localization (extracted from Java Pet Store 1.3.2)

## Why

The legacy Pet Store serves shoppers in three languages and currencies, and its localization rules are spread across the web framework, the storefront, the catalog, the cart, purchase orders, order-processing e-mails, the XML document layer and the admin client. Nobody wrote them down in one place, and the English documentation disagrees with the code about which locales ship. The rebuild needs a single, verifiable statement of that behaviour so it can match what production actually does.

## What Changes

- New capability `localization`, captured as a delta spec of the legacy behaviour:
  - supported storefront locales (en_US, ja_JP, zh_CN) and the en_US default;
  - session locale defaulting, locale-code interpretation, and the change-locale action with its error message;
  - the storefront header language switch, return-to-originating-page, and the change-language screen;
  - page locale resolution and its two-step fallback to en_US;
  - per-locale catalog content and separately stated per-locale prices;
  - cart locale handling;
  - UTF-8 request decoding (before sign-on), UTF-8 page rendering and UTF-8 business documents;
  - order and invoice locale defaults;
  - per-locale price formatting in customer e-mails;
  - the admin tool's English/German text catalogue;
  - locale-aware number formatting and keyword splitting (reachability unconfirmed).
- No requirement is approved yet; every requirement is a draft awaiting SME review. Recommendations are in `legacy-analysis/ir/_recommendations/localization.yaml`.

## Capabilities

### New Capabilities

- `localization`: locale selection, locale-specific content and pricing, character encoding, and locale-dependent formatting across storefront, order processing and administration.

### Modified Capabilities

- none

## Impact

- Cross-cuts catalog (locale-keyed content and prices), cart (line localisation), checkout/purchase orders (order locale), order processing (e-mail formatting) and authentication (encoding before sign-on).
- Open decisions for the Business Owner, detailed in `design.md`: whether zh_CN is a supported locale (code says yes, the English guide says no), whether the framework's sample change-language screen and unused formatting utilities are in production scope, and whether the admin, supplier and order-processing applications need UTF-8 input decoding.
