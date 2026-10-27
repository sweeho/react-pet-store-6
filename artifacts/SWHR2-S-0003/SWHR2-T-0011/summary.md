# Summary — SWHR2-T-0011

Every route now renders inside one shell: header (banner), Global nav rail, main, footer (contentinfo).

- `src/components/shell/AppShell.tsx`, `GlobalNav.tsx`: shell and rail built from `NAV_AREAS` (`src/constants/navigation.ts`), per the Site shell mockup.
- `src/main.tsx`: wraps `useRoutes` in `AppShell`, so `/about`, area routes and the catch-all are covered.
- `src/pages/index.tsx`: removed its own header, nav and mobile dialog (shell owns chrome); tests in `src/pages/index.test.tsx` and `e2e/home.spec.ts` updated to match.
- Tests: `AppShell.test.tsx` (C-0275), `shell-routes.test.tsx` (C-0273/74/76), `e2e/shell.spec.ts`.

Deviations: PLAN.md self-authored (absent). Area routes (`/petstore/cart`, `/admin/orders`, ...) are chosen here and render NotFound inside the shell until their capabilities land. Mockup's search box, language switcher and Catalog sub-list are omitted (owned by later capabilities).

Verification: `bun run verify` pass (54 tests); e2e not runnable here (no Chromium).

CODE-REVIEW: self-review — sub-agent not run; checked landmark uniqueness, doc order, removed-dialog dead code, and no `any`/assertions; nothing rejected.
