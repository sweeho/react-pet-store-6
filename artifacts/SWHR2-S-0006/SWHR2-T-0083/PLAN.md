# PLAN — SWHR2-T-0083 · Site shell 3: Shared layout and global navigation

Change: `swhr2-i-0002-bootstrap-landing-page-and`. Requirements: Global navigation (SWHR2-R-0289), Shared page layout (SWHR2-R-0290). Tasks 3.1, 3.2. Test cases: SWHR2-C-0273, 0274, 0275, 0276.

## Objective

Every route renders inside one `AppShell` with a header, a left navigation rail, a main region and a footer, and the navigation always links back to `/`.

## Steps

1. Read the change's `design.md`, especially "Components" (App shell, Global navigation) and "Planning findings" → P1, P3, D2, D3, D5.
2. `src/components/shell/areas.ts`: export the primary-area list. Each entry has `label`, `to`, `group` and an icon name. Groups and entries:
   - Shop: Catalog & search → `/petstore`; Shopping cart → `/petstore/cart`; Checkout → `/petstore/cart`; Language → `/petstore`
   - Account: Sign in → `/petstore/signin`; Account & profile → `/petstore/signin`
   - Administration: Order approval → `/admin`; Sales reporting → `/admin`
   - Supplier: Supplier inventory → `/supplier`
3. `src/components/shell/GlobalNav.tsx`: a `<nav aria-label="Global">` with a Home link to `/`, then the groups from `areas.ts` as headed lists of `NavLink`s with an active state and visible focus rings (`focus-visible:outline-ring`). Use lucide-react icons.
4. `src/components/shell/AppShell.tsx` (default export): `AppShell({ children, header })`. Render `<header>` (brand mark linking to `/`, and a `header` slot for the search, language, cart and sign-in controls later capabilities add), `GlobalNav` in a 240px left rail, `<main>` holding `children ?? <Outlet />`, and `<footer>` ("Pet Store" and a home link). Use a CSS grid of 240px / 1fr columns and 56px / 1fr / 40px rows at `lg`. Below `lg`, the rail moves behind a menu button (reuse the headlessui Dialog pattern from the current `index.tsx`).
5. `src/main.tsx`: wrap `useRoutes(routes)` (and its Suspense) in `<AppShell>`. Mount it once, at the app root.
6. Remove per-page chrome. In `src/pages/about.tsx`, `src/pages/users/profile.tsx`, `src/pages/users/[id].tsx` and `src/pages/NotFound.tsx`, drop the `min-h-screen` wrappers and "Back to Home" links that duplicate the shell. Keep each page's own h1 and content. Leave `src/pages/users/index.tsx` to SWHR2-T-0084 and `src/pages/index.tsx` to SWHR2-T-0082.
7. Tests: `src/components/shell/AppShell.test.tsx` checks the landmark order and that the children land in main. `src/components/shell/GlobalNav.test.tsx` checks the home link and one link per area entry.

## File/module ownership

`src/main.tsx`, `src/components/shell/AppShell.tsx`, `src/components/shell/GlobalNav.tsx`, `src/components/shell/areas.ts`, their `*.test.tsx`, `src/pages/about.tsx`, `src/pages/users/profile.tsx`, `src/pages/users/[id].tsx`, `src/pages/NotFound.tsx`, `src/pages/[...all].test.tsx` (only if the NotFound change needs it).

## Definition of Done

AC-1 to AC-4 on the ticket. The acceptance cases SWHR2-C-0273 to 0276 in `tests/acceptance/site-shell/` pass; do not edit them. The area routes `/petstore` etc. still 404 until SWHR2-T-0082, but the not-found page renders inside the shell, so 0273 and 0276 pass.

## Design reference

Mockups are committed under `artifacts/SWHR2-S-0006/design/` (index: `MANIFEST.md`), all at a 1440px viewport. Render the route beside the mockup to check your work. `mockup-site-shell.html` (SWHR2-MCK-2): any route, e.g. `/about`, default state, 1440px. It shows the header, the rail with its group headings, the footer and the content well.
