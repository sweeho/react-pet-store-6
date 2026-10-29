# PLAN — SWHR2-T-0144 Catalog paging

Change `swhr2-i-0004-catalog-browsing-and-search`, tasks group 3. Read `design.md` first: §Paging (legacy `Page` arithmetic, kept as specified including D5) and §Target design → Interfaces.

## Objective

Every catalog list returns a page with entries, next/previous indicators and their start positions, using start 0 and size 2 when no paging values are supplied.

## Steps

1. Add `services/catalog/paging.ts`: a pure function from (rows fetched with one look-ahead, start, size) to `{ items, start, size, hasPrevious, hasNext, previousStart, nextStart }`. Previous exists when `start > 0`; `previousStart = max(start - items.length, 0)`; `nextStart = start + items.length` (tasks 3.1).
2. Negative start, or a start past the last entry, returns the empty page (tasks 3.2).
3. Defaults start 0, size 2 when values are absent; a size alone keeps start 0 (tasks 3.3).
4. Apply it to `listCategories` and `listProducts` (fetch `size + 1` rows to compute `hasNext`).
5. Unit tests for the arithmetic in `services/catalog/paging.test.ts`.

## File/module ownership

`services/catalog/paging.ts` (new), `services/catalog/paging.test.ts` (new), `services/catalog/index.ts` (list functions only).

## Definition of Done

AC-1 and AC-2 hold. Acceptance cases SWHR2-C-0186 and C-0187 in `tests/acceptance/catalog-browsing/reads.test.ts` pass.

## Design reference

This ticket changes no screen. The approved mockups are listed in `artifacts/SWHR2-S-0008/design/MANIFEST.md` for the screen ticket.
