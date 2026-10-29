# Design manifest — SWHR2-S-0008

Capability brief **SWHR2-I-0004** (Catalog browsing and search), canvas doc version **12** (frozen). Approved mockups only; the five wireframe blocks on the canvas are drafts and are not designs to build.

| Mockup       | Title                                              | Route and state                                   | Viewport | Block id                               |
| ------------ | -------------------------------------------------- | ------------------------------------------------- | -------- | -------------------------------------- |
| SWHR2-MCK-8  | Home screen — pet selection map and category panel | `/petstore` (also `/`), pet map and panel loaded  | 1440     | `8f61105b-6068-4cab-b003-75c35bdc01ae` |
| SWHR2-MCK-9  | Category product list                              | `/petstore/category/DOGS`, first page             | 1440     | `6aebf0ea-205e-457e-9eee-f6e7257457ca` |
| SWHR2-MCK-10 | Product item list                                  | `/petstore/product/<Bulldog product id>`, default | 1440     | `b3018448-18a0-4f73-9187-dce2dbf62837` |
| SWHR2-MCK-11 | Item detail                                        | `/petstore/item/EST-1`, default                   | 1440     | `67f01c15-7389-47cb-b79d-c38e2e000cd7` |
| SWHR2-MCK-12 | Search results                                     | `/petstore/search?q=fish`, results shown          | 1440     | `744339f5-735d-4bf7-b180-aa1424570f0f` |

## Getting the HTML

The planning export (`a2a_get_capability_brief_design` with `write_to`) wrote these files to the platform's workspace, not to the sprint branch, so they are not committed here. Fetch a mockup with `a2a_get_capability_brief_design(capability_brief_key="SWHR2-I-0004", block_id=<block id>, write_to="artifacts/SWHR2-S-0008/design/mockup-<slug>.html")`, where `<slug>` is one of `home-screen-pet-selection-map-and-catego`, `category-product-list`, `product-item-list`, `item-detail`, `search-results`.
