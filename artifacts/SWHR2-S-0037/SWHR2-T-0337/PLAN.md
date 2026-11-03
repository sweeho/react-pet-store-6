# PLAN — SWHR2-T-0337 UAT: SWHR2-C-0028 (header flag switch)

Change: `swhr2-s-0037-bugfix-swhr2-t-0337-swhr2-t`. Read its `design.md` FIRST (R2, Decisions D2, D3, D6). This fix depends on SWHR2-T-0339 (root `LocaleProvider`) being merged.

## Objective

A Japanese flag in the page header switches the whole storefront, header included, to Japanese at once.

## Steps

Work `tasks.md` §2 in order. Tick nothing yourself.

1. `StorefrontHeader` reads the locale from `useLocale()`. Keep its session fetch for sign-on state only (D2).
2. Render `LanguageFlags` inside `StorefrontHeader` on storefront paths, not on `/admin/**` or `/supplier/**`, and remove it from `src/pages/petstore.tsx` (D3). Keep its accessible names.
3. Unit test: after a flag click, the header's labels are Japanese on the same route. Do not edit `tests/acceptance/**`.

## File/module ownership

- Modify: `src/components/storefront/StorefrontHeader.tsx`, `src/components/storefront/LanguageFlags.tsx`, `src/pages/petstore.tsx`.
- Create: `src/components/storefront/StorefrontHeader.test.tsx` (or extend the existing header test if one exists).

## Definition of Done

AC-1 and AC-2 on the ticket. Locked case SWHR2-C-0028 passes.
