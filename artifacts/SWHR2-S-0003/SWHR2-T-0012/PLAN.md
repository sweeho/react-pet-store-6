# SWHR2-T-0012 plan (self-authored: no PLAN.md or design dir was on the branch)

Contract from the ticket: EmptyFrame, ErrorFrame, LoadingFrame in `src/components/shell/`, `useApi` in `src/hooks/useApi.ts`.

1. Red: `src/pages/users/index.test.tsx` cites SWHR2-C-0277/0278/0279; production files are sentinel stubs.
2. Implement frames (design tokens only), `useApi` (non-2xx = error, `retry` refetches).
3. Users list maps useApi state onto the frames (`/api/users` returns `{ users }`).
4. `src/main.tsx` Suspense fallback = LoadingFrame; NotFound renders EmptyFrame (title "Not Found").
