# PLAN — SWHR2-T-0082 · Site shell 2: Landing page

Change: `swhr2-i-0002-bootstrap-landing-page-and`. Requirement: Landing page (SWHR2-R-0288). Tasks 2.1, 2.2. Test cases: SWHR2-C-0270, 0271, 0272.

## Objective

`/` shows the Pet Store landing page inside the shell. It links once to each primary-area route, and each route opens a page.

## Steps

1. Read the change's `design.md`, especially "Components" (Root landing page) and "Planning findings" → P2, P3, D4, D5.
2. `src/pages/index.tsx`: replace the Vortex hero with the landing content from the Landing page mockup. Include an h1 "Welcome to Pet Store", an intro line, a "Browse the catalog" call to action, and an "Everything in the store" card grid. The grid has one card per primary area from `src/components/shell/areas.ts`, with staff-only areas marked "Staff sign-in". The page renders only its content: the shell comes from `main.tsx`. **Exactly one link per route** `/petstore`, `/petstore/cart`, `/petstore/signin`, `/admin`, `/supplier` inside the page's own markup (SWHR2-C-0271 counts them). Show cards for entries without a route of their own (Checkout, Language, Account & profile, Sales reporting) as text, not as duplicate links, or fold them into their area's card. Leave out the "Choose a pet" category panel: it belongs to catalog-browsing (non-scope).
3. Area placeholders, each rendering `EmptyFrame` with the area name and a link back to `/`:
   - `src/pages/petstore.tsx` (layout, renders `<Outlet />`), `src/pages/petstore/index.tsx`, `src/pages/petstore/cart.tsx`, `src/pages/petstore/signin.tsx`
   - `src/pages/admin.tsx` (layout), `src/pages/admin/index.tsx`
   - `src/pages/supplier.tsx` (layout), `src/pages/supplier/index.tsx`
     Placeholder text must not contain "not found" or "404" (SWHR2-C-0272).
4. Rewrite `src/pages/index.test.tsx` (h1, one link per area route) and `e2e/home.spec.ts` (landing heading and area links visible, no vertical scrollbar at 1280×720 and 1920×1080; drop the hero and mobile-dialog assertions that belonged to the old page).

## File/module ownership

`src/pages/index.tsx`, `src/pages/index.test.tsx`, `e2e/home.spec.ts`, `src/pages/petstore.tsx`, `src/pages/petstore/index.tsx`, `src/pages/petstore/cart.tsx`, `src/pages/petstore/signin.tsx`, `src/pages/admin.tsx`, `src/pages/admin/index.tsx`, `src/pages/supplier.tsx`, `src/pages/supplier/index.tsx`.

## Definition of Done

AC-1 to AC-3 on the ticket. The acceptance cases SWHR2-C-0270 to 0272 pass, and every site-shell acceptance case (0270 to 0279) is green on the integrated branch.

## Design reference

Mockups are committed under `artifacts/SWHR2-S-0006/design/` (index: `MANIFEST.md`), all at a 1440px viewport. Render the route beside the mockup to check your work.

- `mockup-landing-page.html` (SWHR2-MCK-1): route `/`, default state.
- `mockup-empty-state.html` (SWHR2-MCK-3): the look of the area placeholders, e.g. `/admin`.
