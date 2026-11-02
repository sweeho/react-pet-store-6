# PLAN — SWHR2-T-0324 Place order duplicating shopping cart

Change: `swhr2-i-0015-place-order-duplicating-sho`. Read its `design.md` FIRST (Root cause, Decisions D1–D4), then `specs/site-shell/spec.md`.

## Objective

Remove the global navigation's "Place order" entry, which duplicates "Shopping cart". Afterwards no two entries share a destination and only the current page's entry is highlighted. Placing an order from checkout is unchanged.

## Steps

Work the `tasks.md` items in order. Tick nothing yourself.

1. Remove the entry from the area list (design.md D1).
2. Remove the unused credit-card icon from the type and the icon map (D2).
3. Update the navigation unit test (D3):
   - drop the "Place order" row
   - assert the Shop group's entries
   - assert distinct link destinations
   - assert a single `aria-current="page"` link on `/petstore/cart`
4. Run the existing landing-page, site-shell and checkout coverage unchanged (D4); none should need edits. Do not edit `tests/acceptance/**`.

## File/module ownership

Modify: `src/components/shell/areas.ts`, `src/components/shell/GlobalNav.tsx`, `src/components/shell/GlobalNav.test.tsx`.

## Definition of Done

AC-1 … AC-4 on the ticket, each proven by the updated `GlobalNav.test.tsx`. The existing landing-page, site-shell and checkout tests stay green.
