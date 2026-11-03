# PLAN — SWHR2-T-0333 Catalog "Choose a pet" layout misaligned

Change: `swhr2-i-0017-catalog-choose-a-pet-layout`. Read its `design.md` FIRST (Root cause, Decisions D1–D4), then `specs/catalog-browsing/spec.md`.

## Objective

Make the home page's pet picture span its panel at any width, with each pet's cell above its name cell. Selecting a pet in the picture opens that pet's category at any width. The names row stays unchanged.

## Steps

Work the `tasks.md` items in order. Tick nothing yourself.

1. Make the picture full-width with automatic height, keeping its alt text and `width`/`height` attributes (design.md D1, D3).
2. Replace `<map>`/`<area>` with five absolutely positioned overlay `Link`s, each 20 % wide and full picture height, named after the pet (D2).
3. Update `PetMap.test.tsx`: drop the `usemap` assertion and keep the per-pet href assertion (D4).
4. Add `e2e/pet-map.spec.ts` checking alignment within 2 px, no gutter, and click-through at a panel width under 1000 px and one near 1400 px (D4). Run it at least once before committing.
5. Leave `public/images/splash.svg` and the names row unchanged. Do not edit `tests/acceptance/**`.

## File/module ownership

- Modify: `src/components/storefront/PetMap.tsx`, `src/components/storefront/PetMap.test.tsx`.
- Create: `e2e/pet-map.spec.ts`.

## Definition of Done

AC-1 … AC-5 on the ticket. The PetMap unit test and the new e2e spec pass, and the existing home, catalog-browsing and site-shell suites stay green.
