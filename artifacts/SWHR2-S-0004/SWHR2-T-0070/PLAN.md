# PLAN — SWHR2-T-0070 · Site shell 2 — Landing page

Change: `swhr2-i-0002-bootstrap-landing-page-and` · Requirement: **Landing page** (SWHR2-R-0288) · tasks.md group 2 (2.1, 2.2) · Test cases: SWHR2-C-0271, SWHR2-C-0272

## Objective

Replace the boilerplate hero at `/` with the Pet Store landing page from SWHR2-MCK-1, linking to every primary area, and give every linked area a page that is not the not-found page.

## Steps

1. Create `src/constants/areas.ts`: the single primary-area config (label, group Shop / Account / Administration / Supplier, route, short description) that the landing page uses now and `GlobalNav` uses in phase 3 (design.md §Target design → Global navigation; §Sprint planning → SD3). Routes: `/petstore` (Catalog and search), `/petstore/cart`, `/petstore/checkout`, `/petstore/language`, `/petstore/signin`, `/petstore/account`, `/admin` (Order approval), `/admin/sales`, `/supplier`. The five routes the acceptance suite pins (`/petstore`, `/petstore/cart`, `/petstore/signin`, `/admin`, `/supplier`) must each appear exactly once in the landing page content.
2. Rewrite `src/pages/index.tsx` from MCK-1: one level-1 heading introducing the store, the category teaser, and the "Everything in the store" card grid driven by `areas.ts`. The page renders only its own content (no header, nav or footer — phase 3 wraps it). It must render without the shell, inside a bare `MemoryRouter` (SWHR2-C-0271 renders it that way). Use `Link` for internal links.
3. Add placeholder pages for each area route in `areas.ts` under `src/pages/petstore/`, `src/pages/admin/` and `src/pages/supplier/` (e.g. `petstore/index.tsx`, `petstore/cart.tsx`, `admin/index.tsx`, `supplier/index.tsx`). Each renders a heading and a short "coming soon" line. Phase 4 converts them to `EmptyFrame`. Do not create `src/pages/petstore.tsx` / `admin.tsx` / `supplier.tsx` parent files (SD1).
4. Rewrite `src/pages/index.test.tsx` and `e2e/home.spec.ts` for the landing page: the old assertions target boilerplate copy that no longer exists.

## File/module ownership

- `src/constants/areas.ts` (new)
- `src/pages/index.tsx`, `src/pages/index.test.tsx`
- `src/pages/petstore/**`, `src/pages/admin/**`, `src/pages/supplier/**` (new placeholders; handed to SWHR2-T-0072 afterwards)
- `e2e/home.spec.ts`

## Definition of Done

- AC-1 met; SWHR2-C-0271 (`tests/acceptance/site-shell/shell.test.tsx`) and SWHR2-C-0272 (`tests/acceptance/site-shell/e2e/shell.spec.ts`) pass.
- C-0270 still passes.

## Design reference

Mockups are committed under `artifacts/SWHR2-S-0004/design/` (index: `MANIFEST.md`), all at a 1440px viewport. Render the route beside the mockup to check your work.

- `mockup-landing-page.html` (SWHR2-MCK-1) → route `/`, default state, 1440px. Build the content area only; the left rail, header and footer drawn around it are phase 3's.
