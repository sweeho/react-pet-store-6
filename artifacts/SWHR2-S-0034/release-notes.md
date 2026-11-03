---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0034
capability_brief: SWHR2-I-0015
branch: vortex/sprint/swhr2-s-0034-75d0ae42
upstream: [artifacts/SWHR2-S-0034/qa-test-report.md]
---

# Release notes — SWHR2-S-0034

## Fixed

- **No more duplicate "Place order" menu entry.** The left menu's Shop group no longer has a "Place order" entry that opened the shopping cart. It now lists Catalog & search, Shopping cart and Language. On the cart page only "Shopping cart" is highlighted. (SWHR2-T-0324)

## Changed

- **Landing page cart card.** The "Shopping cart" card no longer shows a "Place order" sub-label. (SWHR2-T-0324)

## Upgrade notes

- Placing an order works as before: open the cart, choose Check out, then Place order.
- No migration, configuration or dependency change.
