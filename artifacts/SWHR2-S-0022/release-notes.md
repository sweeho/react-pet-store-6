---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0022
capability_brief: SWHR2-I-0007
branch: vortex/sprint/swhr2-s-0022-358d0d57
upstream: [artifacts/SWHR2-S-0022/qa-test-report.md]
---

# Release notes — SWHR2-S-0022

## Added

- **Shopping cart** for every browsing session. It starts empty and needs no sign-on. Separate sessions have separate carts. (SWHR2-T-0276)
- **Add to Cart** from a product's item list, from item detail and from search results. The item goes in with quantity 1, and adding it again sets the quantity back to 1. Adding takes the shopper to the cart. (SWHR2-T-0276)
- **Cart screen**: each line shows the item and product name linked to the item's page, a quantity field, the unit price in the shopper's currency and a **Remove** control. Below the lines are **Update Cart**, the cart total and **Check Out**. An empty cart shows only "Your Shopping Cart is Empty." The screen is available in English, Japanese and Chinese. (SWHR2-T-0276)
- **Update Cart** replaces each line's quantity with the one typed. **Remove** takes out the whole line, and removing an item that is not in the cart changes nothing. (SWHR2-T-0276)
- The cart is gone after sign-out and when the session ends after 15 minutes idle. (SWHR2-T-0276)
- **Error pages** for an empty-cart order, catalog errors and unexpected server errors. A failure with no page of its own shows the page of its more general kind, or the Server Error page. (SWHR2-T-0276)

## Changed

- The cart screen opens already showing its contents in the selected language, with no flash of default text. (SWHR2-T-0278)

## Fixed

- None.

## Upgrade notes

- No database migration. The cart is held in server memory per session, so it is lost on a server restart.
- New API: `GET /api/cart`, `PUT /api/cart`, `POST /api/cart/items`, `DELETE /api/cart/items/{itemId}`, each returning `{ locale, lines, total }`. A failure reply has the shape `{ kind, kinds, message, trace }`. (SWHR2-T-0276)
- Catalog data access also reads `CATALOG_DAO_CLASS` and `CATALOG_DAO_DATABASE`. The existing `CATALOG_DATA_ACCESS` and `CATALOG_DB_DIALECT` still work. (SWHR2-T-0278)

## Not included

- Placing an order, and so clearing the cart on order and the empty-cart order check. Both arrive with checkout (SWHR2-I-0008). Until then, **Check Out** leads to a page that does not exist yet.
