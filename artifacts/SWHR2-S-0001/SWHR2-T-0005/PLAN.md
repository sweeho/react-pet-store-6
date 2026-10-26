---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0001
ticket: SWHR2-T-0005
branch: vortex/sprint/swhr2-s-0001-67b3b433
upstream: [openspec/changes/swhr2-i-0002-bootstrap-landing-page-and/design.md]
downstream:
  [
    artifacts/SWHR2-S-0001/SWHR2-T-0005/tdd-test-result.md,
    artifacts/SWHR2-S-0001/SWHR2-T-0005/summary.md,
  ]
---

# Plan — SWHR2-T-0005: Landing page — Pet Store landing page at / linking to every primary area

Change `swhr2-i-0002-bootstrap-landing-page-and` · requirement **Landing page** (SWHR2-R-0288) · tasks 2.1, 2.2 · read `design.md` §Planning findings FIRST.

## Objective

Opening `/` shows the Pet Store landing page from `mockup-landing-page.html`. It has a welcome heading, a short intro and one card per primary area ("Everything in the store"), and each card links to that area. The list of areas lives in one shared constant that the global navigation (SWHR2-T-0006) also reads.

## Steps

1. Create `src/constants/areas.ts` exporting `PrimaryArea` and `PRIMARY_AREAS` exactly as in design.md §Interface contracts, with the nine rows of §Primary-area route map in that order. Each `description` is the card copy from the landing mockup (e.g. Cart: "Add items without signing in. Kept for this visit only."). Do not touch `src/constants/index.ts`.
2. Rewrite `src/pages/index.tsx` as the landing page. Use one `<h1>` "Welcome to Pet Store" and the intro line. Render a card grid grouped by area group, where each card is a react-router `<Link to={area.href}>` showing label and description. Administration and Supplier cards carry the mockup's "Staff sign-in" tag. Drop the hero, the dark gradient, the `#` links and the headlessui dialog.
3. **Exactly one link per area href** on the page (SWHR2-C-0271 counts them). Do not add a separate "Browse the catalog" button that also links `/petstore`, and do not build the pet selection map; that belongs to catalog-browsing, per canvas §Out of Scope and design.md SD-2.
4. The page renders content only: no `<header>`, `<nav>`, `<footer>` or `<main>` of its own, and no `h-screen`/`min-h-screen` wrapper. SWHR2-T-0006 supplies the frame.
5. Rewrite `src/pages/index.test.tsx` for the new page. Render it in a `MemoryRouter`, then assert the h1 and that each `PRIMARY_AREAS` href has exactly one link.
6. Rewrite `e2e/home.spec.ts`. Open `/`, assert the h1 is visible and that each primary-area link is visible and opens its URL. Do not assert area page contents, because those pages arrive in SWHR2-T-0007. Drop the scrollbar and mobile-dialog tests.
7. Run the protected acceptance case SWHR2-C-0271 (`tests/acceptance/site-shell/shell.test.tsx`, "landing page" describe) and confirm it passes. Never edit that file.

## File/module ownership

- `src/constants/areas.ts` (new)
- `src/pages/index.tsx`
- `src/pages/index.test.tsx`
- `e2e/home.spec.ts`

## Design reference

Files: `artifacts/SWHR2-S-0001/design/mockup-landing-page.html` (1440×900), `artifacts/SWHR2-S-0001/design/wireframe-landing-page.html`.
Canvas: SWHR2-I-0002 · doc v12
Agent fetch: `curl -H "Authorization: Bearer $VORTEX_A2A_RUN_TOKEN" "$VORTEX_CANVAS_BASE_URL/canvas/415b4a3a-f05d-40ec-8eff-a5f9a7c42b09/render.html"`

What this ticket must match: the content area of the landing mockup, meaning the welcome heading, the intro and the "Everything in the store" card grid with its tags. Out of scope: the header, the rail and the footer (SWHR2-T-0006), and the "Choose a pet" category map (catalog-browsing).

## Definition of Done

AC-1, AC-2, AC-3, AC-4, AC-5 of SWHR2-T-0005.
