---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0009
capability_brief: SWHR2-I-0004
branch: vortex/sprint/swhr2-s-0009-8024784a
upstream: [artifacts/SWHR2-S-0009/qa-test-report.md]
---

# Release notes — SWHR2-S-0009

## Added

- The Home screen shows a pet selection map; its Birds, Fish, Dogs, Reptiles and Cats regions each open that category. (SWHR2-T-0158)
- A category panel on every storefront screen lists all categories in the shopper's language, sorted by name. (SWHR2-T-0158)
- Category pages list products by name, two per page, with Previous and Next shown only when there is an earlier or later page. (SWHR2-T-0155, SWHR2-T-0158)
- Product pages list their items, each with Add to Cart; item pages show the picture, List Price, Your Price and Add to Cart. (SWHR2-T-0158, SWHR2-T-0159)
- The header search box finds items whose product name, category code or description contains any of the typed words; case is ignored, repeated words count once, and a blank search returns nothing. (SWHR2-T-0156, SWHR2-T-0158)
- Shoppers see only names, descriptions and prices held for their current language; an item without details in that language is hidden everywhere. (SWHR2-T-0153, SWHR2-T-0154)
- If the catalog cannot be read, the shopper sees the standard error message with Try again rather than an empty list. (SWHR2-T-0154, SWHR2-T-0158)

## Changed

- Category lists, product lists and the category panel may lag a catalog change by up to five minutes; item pages and search results are always current. (SWHR2-T-0157)
- The cart page shows each line's item id beside its name. (SWHR2-T-0158)

## Fixed

- The localization end-to-end check expected the Simplified Chinese cart price in the old unit and failed; it now expects the price in hundredths. (SWHR2-T-0159, closes SWHR2-T-0160 / SWHR2-T-0161)

## Upgrade notes

- Database migration `drizzle/0002_married_otto_octavius.sql` adds the catalog tables, foreign keys and indexes; SQLite foreign keys are now enforced. An empty catalog is seeded with five categories on start-up. (SWHR2-T-0153)
- All stored prices are integer hundredths of the displayed unit, in every locale. (SWHR2-T-0153)
- New optional settings `CATALOG_DATA_ACCESS` (default `drizzle`) and `CATALOG_DB_DIALECT` (default `sqlite`) select the catalog data access; an unknown value makes catalog reads fail. (SWHR2-T-0154)
- The catalog page cache lives in server memory and assumes a single server process.

## Not included

- Per-category product counts on the pet map, the Home help cards, the category name in breadcrumbs and the Category column on item detail and search results, all shown in the mockups (see `SWHR2-T-0159/design-check.md`, D1–D8).
- Product pictures: the seed's image files are not present, so a placeholder is shown.

## Verification

Verified at integration QA — `artifacts/SWHR2-S-0009/qa-test-report.md` (PASS; browser E2E not executed, UI checked by jsdom page tests).

## Compliance / Control Evidence

| Control                      | Evidence            | Location                                   | Status    | Exception                |
| ---------------------------- | ------------------- | ------------------------------------------ | --------- | ------------------------ |
| Release contents recorded    | this file           | `artifacts/SWHR2-S-0009/release-notes.md`  | Satisfied | —                        |
| Release verified before land | QA PASS verdict     | `artifacts/SWHR2-S-0009/qa-test-report.md` | Satisfied | Browser E2E not executed |
| Migrations disclosed         | Upgrade notes above | `drizzle/0002_married_otto_octavius.sql`   | Satisfied | —                        |
