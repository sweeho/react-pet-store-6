# Proposal: Localization (extracted from Java Pet Store 1.3.2)

## Why

The legacy Pet Store serves shoppers in three languages and currencies, and its localization rules are spread across the web framework, the storefront, the catalog, the cart, purchase orders, order-processing e-mails, the XML document layer and the admin client. Nobody wrote them down in one place, and the English documentation disagrees with the code about which locales ship. The rebuild needs a single, verifiable statement of that behaviour so it can match what production actually does.

## What Changes

- New capability `localization`, captured as a delta spec of the 11 approved legacy behaviours:
  - supported storefront locales (en_US, ja_JP, zh_CN), the en_US default and the header flag switch;
  - locale change applied to session and cart;
  - locale-code interpretation;
  - page locale resolution and its fallback to en_US;
  - the change-language screen;
  - catalog display details per locale and cart lines in the cart's locale (en_US default);
  - UTF-8 interpretation of submitted text, established before sign-on;
  - locale-aware money and number formatting and keyword splitting.
- Records not approved are Not specified and left out; recommendations are in `legacy-analysis/ir/_recommendations/localization.yaml`.

## Capabilities

### New Capabilities

- `localization`: locale selection, locale-specific content and pricing, character encoding, and locale-dependent formatting across storefront, order processing and administration.

### Modified Capabilities

- none

## Impact

- Cross-cuts catalog (locale-keyed content and prices), cart (line localisation), checkout/purchase orders (order locale), order processing (e-mail formatting) and authentication (encoding before sign-on).
- Open decisions for the Business Owner, detailed in `design.md`: whether zh_CN is a supported locale (code says yes, the English guide says no), and whether the admin, supplier and order-processing applications need UTF-8 input decoding. The change-language screen and the formatting utilities were approved by an SME although no caller was found in the legacy tree.
