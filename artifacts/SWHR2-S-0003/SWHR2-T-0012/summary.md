# SWHR2-T-0012 summary

Added shared `EmptyFrame`, `ErrorFrame`, `LoadingFrame` (`src/components/shell/`) and `useApi` (`src/hooks/useApi.ts`; non-2xx is an error, `retry` refetches). The users list maps useApi state onto the frames; `src/main.tsx` Suspense fallback is `LoadingFrame`; `NotFound` renders `EmptyFrame` (title "Not Found").

AC: empty frame (C-0277), error frame with Retry (C-0278), retry refetch (C-0279), loading fallback, not-found as empty frame.

Verification: `bun run verify` passed (57 tests). Red/green recorded by the platform.

Deviations: no PLAN.md or design dir existed on the branch, so PLAN.md was self-authored. The mockup export did not land in the worktree, so no side-by-side design-check was done; frames use design tokens only. E2E not run.

CODE-REVIEW: self-review — sub-agent not used; checked diff for minimality and hook cancellation/stale-state handling.
