# SWHR2-T-0084 summary

Added shared `EmptyFrame`, `ErrorFrame` (Try again button, accessible name "Retry: try again", Back to home link) and `LoadingFrame` in `src/components/shell/`, plus `useApi` in `src/hooks/` (exported from `index.ts`). `/users` now loads `/api/users` through `useApi`, accepts a bare array or `{ users }`, and maps loading, error and empty onto the frames; its hard-coded list and page chrome are removed.

AC coverage: frame contracts and `useApi` behaviour are covered by co-located tests; `/users` states by `src/pages/users/index.test.tsx` and the acceptance cases C-0277 to C-0279.

Verification: `bun run verify` exit 0, 14 files, 41 tests passed. E2E not run (no Chromium in this container). Platform red and green runs recorded via `a2a_run_tests`.

Deviation: error frame message and title have defaults; `/users` passes its own title. Cases already passing at red: none.

CODE-REVIEW: self-review — sub-agent not used for a small diff; checked cancellation on unmount, retry resetting loading/error, and that no test was weakened; no findings.
