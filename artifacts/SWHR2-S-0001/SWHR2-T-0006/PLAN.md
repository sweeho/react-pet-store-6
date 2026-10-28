---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0001
ticket: SWHR2-T-0006
branch: vortex/sprint/swhr2-s-0001-67b3b433
upstream: [openspec/changes/swhr2-i-0002-bootstrap-landing-page-and/design.md]
downstream:
  [
    artifacts/SWHR2-S-0001/SWHR2-T-0006/tdd-test-result.md,
    artifacts/SWHR2-S-0001/SWHR2-T-0006/summary.md,
  ]
---

# Plan — SWHR2-T-0006: Site shell — shared header, global navigation rail and footer around every route

Change `swhr2-i-0002-bootstrap-landing-page-and` · requirements **Global navigation** (SWHR2-R-0289), **Shared page layout** (SWHR2-R-0290) · tasks 3.1, 3.2 · read `design.md` §Interface contracts and §Spec discrepancies SD-1, SD-6 FIRST.

## Objective

Every route, including `/`, `/about`, `/users` and unknown routes, renders inside one shell. The shell has a header across the top, the global navigation as a left rail, the page in `<main>` beside it, and a footer, using the grid in `mockup-site-shell.html`. The navigation links home and to every primary area.

## Steps

1. Create `src/components/shell/GlobalNav.tsx` per design.md §Interface contracts. Use `<nav aria-label="Global">` with a first link "Home" (`href="/"`), then the `PRIMARY_AREAS` rows grouped under headings Shop / Account / Administration / Supplier (SD-6). Use react-router `NavLink` (`end` on `/`, `/petstore` and `/admin`, so parents are not active on child routes), with `aria-current="page"` on the active link. Give links a visible focus ring (`focus-visible:outline-2 outline-brand`). Use lucide-react icons as in the mockup. Do not add category links.
2. Create `src/components/shell/AppShell.tsx`: `AppShell({ children })`. Use a CSS grid with columns `240px 1fr` and rows `56px 1fr 40px`. The `<header>` spans the top row and holds the brandmark "Pet Store", which links `/`. `<GlobalNav />` is the left column. `<main>` holds `children` and scrolls. The `<footer>` reads "Pet Store · Home". Use the brand, surface and border tokens from SWHR2-T-0004. Below the `md` breakpoint, stack the rail above main and keep it visible; no dialog is needed for the MVP. Do not build search, language flags or Cart/Account/Sign-in controls (canvas §Out of Scope).
3. In `src/main.tsx`, wrap `useRoutes(routes)` in `<AppShell>` inside `BrowserRouter`, keeping the existing `Suspense`. This is the ONLY place AppShell is mounted (SD-1); create no `petstore.tsx`, `admin.tsx` or `supplier.tsx` parent routes.
4. Remove each existing page's own full-screen chrome so it sits in `<main>`: drop the `min-h-screen` wrappers and "← Back to Home" links in `src/pages/about.tsx`, `src/pages/users/profile.tsx` and `src/pages/users/[id].tsx`; drop `mt-28 min-h-screen` in `src/pages/NotFound.tsx`; drop the wrapper in `src/pages/RootErrorBoundary.tsx`. Content and headings stay. Do NOT touch `src/pages/users/index.tsx` (SWHR2-T-0007 owns it).
5. Add `src/components/shell/AppShell.test.tsx`. Inside a memory router, assert exactly one banner, navigation, main and contentinfo, with children inside main between header and footer. Add `src/components/shell/GlobalNav.test.tsx`, asserting the `/` link comes first, there is one link per `PRIMARY_AREAS` href, and `aria-current` is set on the active route.
6. Add `e2e/shell.spec.ts`. For `/`, `/about` and `/does-not-exist`, assert the banner, navigation, main and contentinfo are visible. From `/about`, clicking the nav's `/` link lands on `/` with the h1 visible.
7. Confirm the protected acceptance case SWHR2-C-0275 passes. SWHR2-C-0273, C-0274 and C-0276 pass for `/`, `/about` and unknown routes now, and for the area routes after SWHR2-T-0007. Never edit `tests/acceptance/**`.

## File/module ownership

- `src/components/shell/AppShell.tsx`, `src/components/shell/AppShell.test.tsx` (new)
- `src/components/shell/GlobalNav.tsx`, `src/components/shell/GlobalNav.test.tsx` (new)
- `src/main.tsx`
- `src/pages/about.tsx`, `src/pages/NotFound.tsx`, `src/pages/RootErrorBoundary.tsx`, `src/pages/users/profile.tsx`, `src/pages/users/[id].tsx`
- `e2e/shell.spec.ts` (new)

Reads but does not modify: `src/constants/areas.ts` (SWHR2-T-0005).

## Design reference

Files: `artifacts/SWHR2-S-0001/design/mockup-site-shell.html` (1440×900), `artifacts/SWHR2-S-0001/design/wireframe-site-shell.html`.
Canvas: SWHR2-I-0002 · doc v12
Agent fetch: `curl -H "Authorization: Bearer $VORTEX_A2A_RUN_TOKEN" "$VORTEX_CANVAS_BASE_URL/canvas/415b4a3a-f05d-40ec-8eff-a5f9a7c42b09/render.html"`

What this ticket must match: the header bar (brandmark only), the left rail's grouping, spacing, active-item treatment and focus states, the footer strip, and the 56/240/40 grid. Out of scope: the header's search, flags, Cart/Account/Sign-in controls, the rail's category list, and the page body (the breadcrumb and product list are catalog-browsing's).

## Definition of Done

AC-1, AC-2, AC-3, AC-4, AC-5, AC-6 of SWHR2-T-0006.
