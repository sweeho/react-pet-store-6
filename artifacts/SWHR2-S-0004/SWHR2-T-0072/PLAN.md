# PLAN — SWHR2-T-0072 · Site shell 4 — Shared empty, error and loading frames

Change: `swhr2-i-0002-bootstrap-landing-page-and` · Requirement: **Shared state frames** (SWHR2-R-0291) · tasks.md group 4 (4.1, 4.2, 4.3) · Test cases: SWHR2-C-0277, SWHR2-C-0278, SWHR2-C-0279

## Objective

Provide the three shared frames and the data hook every page maps onto them, and prove them on `/users` and the area placeholders.

## Steps

1. `src/components/shell/EmptyFrame.tsx`, `ErrorFrame.tsx`, `LoadingFrame.tsx` (design.md §Target design → Shared state frames; DESIGN.md §State frames). `EmptyFrame` takes `message`, optional `hint` and `action`; `ErrorFrame` takes `message` and `onRetry` and renders a button whose visible label is "Try again" (brief, MCK-4) followed by visually hidden text " — retry", so its accessible name contains both the visible label and "retry" (SD7); `LoadingFrame` takes optional `label` and renders `role="status"`.
2. `src/hooks/useApi.ts`: `useApi<T>(url, select?)` → `{ data, error, loading, retry }`. Non-2xx responses are errors. One fetch per mount and one per `retry()` call (SWHR2-C-0279 counts exactly two calls). Export from `src/hooks/index.ts`.
3. `src/pages/users/index.tsx`: load `/api/users` with `useApi`; accept both a bare array and `{ users: [...] }` (SD4); render `LoadingFrame` / `ErrorFrame` / `EmptyFrame` / the list as a `<ul>` of `<li>` links.
4. Convert the phase-2 placeholder pages under `src/pages/petstore/`, `admin/`, `supplier/` to render `EmptyFrame` with an area-specific message (e.g. the cart's "Your Shopping Cart is Empty.").
5. UI tests next to each frame and the hook.

## File/module ownership

- `src/components/shell/EmptyFrame.tsx`, `ErrorFrame.tsx`, `LoadingFrame.tsx` and their `*.test.tsx` (new); `src/components/shell/index.ts` (add exports)
- `src/hooks/useApi.ts`, `useApi.test.ts` (new); `src/hooks/index.ts`
- `src/pages/users/index.tsx`
- `src/pages/petstore/**`, `src/pages/admin/**`, `src/pages/supplier/**`

## Fixed interface contracts

- `EmptyFrame` root carries `data-testid="empty-frame"`; `ErrorFrame` root carries `data-testid="error-frame"` and contains a button whose accessible name matches /retry/i (pinned by the acceptance suite).
- `useApi` returns `{ data, error, loading, retry }`.
- `/api/users` response shape is unchanged.

## Definition of Done

- AC-1 and AC-2 met; SWHR2-C-0277, C-0278, C-0279 (`tests/acceptance/site-shell/shell.test.tsx`) pass.
- C-0270 through C-0276 still pass.

## Design reference

Mockups are committed under `artifacts/SWHR2-S-0004/design/` (index: `MANIFEST.md`), all at a 1440px viewport. Render the route beside the mockup to check your work.

- `mockup-empty-state.html` (SWHR2-MCK-3) → `/petstore/cart`, empty state, 1440px.
- `mockup-error-state.html` (SWHR2-MCK-4) → `/users` with `/api/users` failing, error state, 1440px.
