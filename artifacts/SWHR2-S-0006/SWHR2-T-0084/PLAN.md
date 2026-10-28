# PLAN — SWHR2-T-0084 · Site shell 4: Shared frames and data hook

Change: `swhr2-i-0002-bootstrap-landing-page-and`. Requirement: Shared state frames (SWHR2-R-0291). Tasks 4.1, 4.2, 4.3. Test cases: SWHR2-C-0277, 0278, 0279.

## Objective

Provide the shared empty, error and loading frames plus `useApi`, and prove them on `/users`.

## Steps

1. Read the change's `design.md`, especially "Components" (Shared state frames, Data hook) and "Planning findings" → D1.
2. `src/components/shell/EmptyFrame.tsx`: `EmptyFrame({ title?, message, action? })` with `data-testid="empty-frame"`. Draw it from the empty-state mockup: an icon, a heading, the message and an optional action slot for a link or button.
3. `src/components/shell/ErrorFrame.tsx`: `ErrorFrame({ title?, message?, onRetry })` with `data-testid="error-frame"` and `role="alert"`. It renders a primary button with visible text "Try again" and `aria-label="Retry: try again"`, so the accessible name matches `/retry/i` (the test queries `getByRole("button", { name: /retry/i })`) and still contains the visible label (WCAG 2.5.3). The button calls `onRetry`. The frame also has a "Back to home" link to `/`.
4. `src/components/shell/LoadingFrame.tsx`: `LoadingFrame({ label? })` with `data-testid="loading-frame"`, `role="status"`, `aria-live="polite"`, a spinner and "Loading…" text by default.
5. `src/hooks/useApi.ts`: `useApi<T>(url)` returns `{ data, error, loading, retry }`. Fetch on mount and on `retry()`. A non-2xx status or a rejected promise sets `error`. Export it from `src/hooks/index.ts`.
6. `src/pages/users/index.tsx`: load `/api/users` with `useApi`, accepting either a bare array or `{ users }` (D1). Show `LoadingFrame` while loading, `ErrorFrame onRetry={retry}` on error, `EmptyFrame` when the list is empty, and otherwise the list of names linking to `/users/:id`. Drop its "Back to Home" chrome.
7. Tests: a co-located `*.test.tsx` per frame, `src/hooks/useApi.test.ts` (stub `fetch`), and `src/pages/users/index.test.tsx` for empty, error→retry and populated.

## File/module ownership

`src/components/shell/EmptyFrame.tsx`, `ErrorFrame.tsx`, `LoadingFrame.tsx` and their tests, `src/hooks/useApi.ts` and its test, `src/hooks/index.ts`, `src/pages/users/index.tsx` and its test.

## Definition of Done

AC-1 to AC-5 on the ticket. The acceptance cases SWHR2-C-0277 to 0279 in `tests/acceptance/site-shell/shell.test.tsx` pass; do not edit them.

## Design reference

Mockups are committed under `artifacts/SWHR2-S-0006/design/` (index: `MANIFEST.md`), all at a 1440px viewport. Render the route beside the mockup to check your work.

- `mockup-empty-state.html` (SWHR2-MCK-3): the empty frame, drawn on the cart. Check it at `/users` with an empty list.
- `mockup-error-state.html` (SWHR2-MCK-4): the error frame with Try again and Back to home. Check it at `/users` with the API failing.
- `mockup-site-shell.html` (SWHR2-MCK-2): its content well shows the loading frame ("Loading products…").
