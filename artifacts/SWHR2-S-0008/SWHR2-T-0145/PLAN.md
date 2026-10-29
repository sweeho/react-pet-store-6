# PLAN — SWHR2-T-0145 Catalog keyword search

Change `swhr2-i-0004-catalog-browsing-and-search`, tasks group 4. Read `design.md` first: §Search (legacy) and §Target design → Components → Search.

## Objective

`search(text, locale)` returns each item, once, for which any distinct whitespace-separated keyword is a case-insensitive substring of the product name, the category id or the item description, in that locale only.

## Steps

1. `services/catalog/search.ts`: split on any whitespace (space, tab, line break, form feed), drop duplicates; no keyword left → return an empty result without touching the store (tasks 4.1).
2. One query: per keyword, `lower(product name) like ? or lower(category_id) like ? or lower(item description) like ?`, OR-ed across keywords; bind each keyword lower-cased as `%kw%` with `%` and `_` escaped; each distinct keyword bound once per field (the acceptance spy counts bindings) (tasks 4.2).
3. Same-locale joins of item and product details; apply the page result from SWHR2-T-0144 (tasks 4.3).
4. Export `search` from `services/catalog/index.ts`. Unit tests for tokenizing and matching.

## File/module ownership

`services/catalog/search.ts` (new), `services/catalog/search.test.ts` (new), `services/catalog/index.ts` (export line only).

## Definition of Done

AC-1..AC-7 hold. Acceptance cases SWHR2-C-0178..C-0182, C-0208, C-0209 in `tests/acceptance/catalog-browsing/search.test.ts` pass.

## Design reference

This ticket changes no screen. The approved mockups are listed in `artifacts/SWHR2-S-0008/design/MANIFEST.md` for the screen ticket.
