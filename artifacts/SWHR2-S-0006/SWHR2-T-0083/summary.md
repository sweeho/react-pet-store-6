# Summary — SWHR2-T-0083

One `AppShell` (header, 240px nav rail, main, footer) is now mounted at the app root in `src/main.tsx`, so every route including `/about` and the not-found page renders inside it. `GlobalNav` shows Home plus the areas from `areas.ts`, grouped Shop / Account / Administration / Supplier.

Files: `src/components/shell/{AppShell,GlobalNav}.tsx`, `areas.ts`, two `*.test.tsx`, `src/main.tsx`; per-page chrome removed from `about`, `NotFound`, `users/profile`, `users/[id]`.

AC coverage: global nav with Home link (C-0273/0274); page content between header, nav and footer (C-0275); single shell on all routes (C-0276).

Verification: `bun run verify` exit 0 (26 tests). Platform red and green runs recorded valid. E2E and screenshot design-check not run: no Chromium in this container (see `design-check.md`).

Deviation: `areas.ts` also exports `areaGroups` for ordered headings. `[...all].test.tsx` needed no change.

CODE-REVIEW: self-review — no sub-agent run; diff reviewed for landmarks, focus rings and the single nav in the DOM when the mobile dialog is closed.
