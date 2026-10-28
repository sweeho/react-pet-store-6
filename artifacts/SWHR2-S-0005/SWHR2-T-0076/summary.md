# SWHR2-T-0076 summary

Landing page at `/` (from `mockup-landing-page`) inside a shared shell. Same build as the earlier SWHR2-T-0069, redone on this sprint branch, adapted to the locked acceptance tests.

- `src/components/shell/{areas.ts,GlobalNav.tsx,AppShell.tsx}`: five primary-area routes (`/petstore`, `/petstore/cart`, `/petstore/signin`, `/admin`, `/supplier`); AppShell is a default export.
- `src/main.tsx`: wraps all routes, including not-found, in AppShell.
- `src/pages/index.tsx`: content only, one link per area route. Tests rewritten: `src/pages/index.test.tsx`, `e2e/home.spec.ts`.

AC: root route shows the landing page linking every primary area (unit + locked acceptance tests pass; E2E unrun).

Verification: `bun run verify` passed (19 tests); acceptance landing/shell tests for C-0271 and C-0275 passed. `verify:full` not run (no Chromium).

Deviations: PLAN.md and design files missing from the branch; worked from design.md, specs and the canvas render. Area routes do not exist yet (not-found until their tickets land).

CODE-REVIEW: self-review — sub-agent not run; no findings.
