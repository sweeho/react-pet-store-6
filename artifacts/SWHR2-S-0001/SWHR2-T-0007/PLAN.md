---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0001
ticket: SWHR2-T-0007
branch: vortex/sprint/swhr2-s-0001-67b3b433
upstream: [openspec/changes/swhr2-i-0002-bootstrap-landing-page-and/design.md]
downstream:
  [
    artifacts/SWHR2-S-0001/SWHR2-T-0007/tdd-test-result.md,
    artifacts/SWHR2-S-0001/SWHR2-T-0007/summary.md,
  ]
---

# Plan — SWHR2-T-0007: Shared frames — empty, error (Retry) and loading frames, useApi hook, area placeholder pages

Change `swhr2-i-0002-bootstrap-landing-page-and` · requirement **Shared state frames** (SWHR2-R-0291) · tasks 4.1, 4.2, 4.3 · read `design.md` §Interface contracts and SD-3, SD-4, SD-5, SD-7 FIRST.

## Objective

Every page has one way to say "nothing here", "this failed — Retry" and "loading". The Users page proves the data-to-frame mapping through `useApi`. Each of the nine primary areas opens a placeholder page inside the shell that uses the empty frame, so the frame is complete from day one. The whole site-shell acceptance suite is green and blocks CI.

## Steps

1. Create `src/components/shell/EmptyFrame.tsx`, `ErrorFrame.tsx` and `LoadingFrame.tsx` with the props, test ids and roles in design.md §Interface contracts, styled per the empty and error mockups (centred card, icon, title, message, actions). ErrorFrame's primary button reads **Retry** (SD-4), uses the danger/brand tokens and may take a secondary "Back to home" link to `/`. LoadingFrame shows a spinner with its label, and its spinner respects `prefers-reduced-motion`. No frame text may contain "not found" or "404".
2. Create `src/hooks/useApi.ts` per the contract. Fetch in an effect keyed on `url` and a retry counter, treat `!response.ok` as an error, parse JSON, and ignore results from a superseded request. Do not touch `src/hooks/index.ts`.
3. Rewrite `src/pages/users/index.tsx` to use `useApi("/api/users")` and normalise the result (`Array.isArray(d) ? d : d.users`, SD-3). Show `LoadingFrame` while loading, `ErrorFrame onRetry={retry}` on error, `EmptyFrame` when the list is empty, and otherwise the list (`<ul>`/`<li>` with links to `/users/:id`). Drop the `min-h-screen` wrapper.
4. Create a placeholder page for each `PRIMARY_AREAS` row: `src/pages/petstore/index.tsx`, `petstore/cart.tsx`, `petstore/checkout.tsx`, `petstore/change-language.tsx`, `petstore/signin.tsx`, `petstore/account.tsx`, `src/pages/admin/index.tsx`, `admin/tool.tsx` and `src/pages/supplier/index.tsx`. Each renders an h1 with the area label and an `EmptyFrame` saying the area is coming soon, with an action linking back to `/`. Later capabilities replace these files.
5. UI tests: `EmptyFrame.test.tsx`, `ErrorFrame.test.tsx` (Retry calls `onRetry`) and `LoadingFrame.test.tsx` beside the components. Add `src/hooks/useApi.test.ts` for success, non-2xx, rejection and retry. Add `src/pages/users/index.test.tsx` for the empty, error, retry and list cases with a stubbed `fetch`.
6. Add `e2e/areas.spec.ts`. For each primary-area href, opening it shows the shell landmarks and the empty frame, and clicking its nav link from `/` lands there.
7. CI (`.github/workflows/ci.yml`): add a **blocking** step that runs only the site-shell acceptance cases (unit and browser), placed beside the existing whole-suite acceptance steps. Those steps stay `continue-on-error`; other capabilities are still red.
8. Confirm every case in `tests/acceptance/site-shell/shell.test.tsx` and `tests/acceptance/site-shell/e2e/shell.spec.ts` passes, SWHR2-C-0270 to C-0279. Never edit `tests/acceptance/**`.

## File/module ownership

- `src/components/shell/EmptyFrame.tsx`, `ErrorFrame.tsx`, `LoadingFrame.tsx` and their `*.test.tsx` (new)
- `src/hooks/useApi.ts`, `src/hooks/useApi.test.ts` (new)
- `src/pages/users/index.tsx`, `src/pages/users/index.test.tsx` (new)
- `src/pages/petstore/index.tsx`, `cart.tsx`, `checkout.tsx`, `change-language.tsx`, `signin.tsx`, `account.tsx` (new)
- `src/pages/admin/index.tsx`, `src/pages/admin/tool.tsx`, `src/pages/supplier/index.tsx` (new)
- `e2e/areas.spec.ts` (new)
- `.github/workflows/ci.yml`

Reads but does not modify: `src/constants/areas.ts` and `src/components/shell/AppShell.tsx`/`GlobalNav.tsx`.

## Design reference

Files: `artifacts/SWHR2-S-0001/design/mockup-empty-state.html`, `artifacts/SWHR2-S-0001/design/mockup-error-state.html` (1440×900), `artifacts/SWHR2-S-0001/design/wireframe-empty-state.html`, `artifacts/SWHR2-S-0001/design/wireframe-error-state.html`, and the loading strip in `artifacts/SWHR2-S-0001/design/mockup-site-shell.html`.
Canvas: SWHR2-I-0002 · doc v12
Agent fetch: `curl -H "Authorization: Bearer $VORTEX_A2A_RUN_TOKEN" "$VORTEX_CANVAS_BASE_URL/canvas/415b4a3a-f05d-40ec-8eff-a5f9a7c42b09/render.html"`

What this ticket must match: the empty card (icon, title, message, actions) and the error card ("Couldn't load" eyebrow, title, message, primary Retry and secondary Back to home), plus the loading indicator. Out of scope: the cart-specific copy and buttons in the empty mockup (shopping-cart passes its own message) and the Dogs breadcrumb (catalog-browsing).

## Definition of Done

AC-1 through AC-9 of SWHR2-T-0007.
