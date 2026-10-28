# Summary — SWHR2-T-0082

`/` now shows the Pet Store landing page (h1 "Welcome to Pet Store", "Browse the catalog" CTA, "Everything in the store" card grid built from `areas.ts`). Each of `/petstore`, `/petstore/cart`, `/petstore/signin`, `/admin`, `/supplier` is linked exactly once; admin and supplier cards carry "Staff sign-in". Each route has an `EmptyFrame` placeholder page with a link home, under `petstore`, `admin` and `supplier` layout files that render `<Outlet />`.

Files: `src/pages/index.tsx`, `index.test.tsx`, `e2e/home.spec.ts`, `src/pages/{petstore,admin,supplier}.tsx`, `src/pages/{petstore/{index,cart,signin},admin/index,supplier/index}.tsx`.

AC coverage: landing page with links to every area (C-0270, C-0271); area routes render pages, not not-found (C-0272, placeholder text avoids "not found"/"404").

Verification: `bun run verify` exit 0 (44 tests). Platform red and green runs valid. E2E and screenshot design-check not run: no Chromium in this container; `e2e/home.spec.ts` is rewritten but unexecuted.

Deviations: the /petstore link is the CTA, so the Catalog card is plain text (one link per route). Cards are one per distinct route, with merged labels (e.g. Shopping cart · Checkout). The mockup's "Choose a pet" panel is left out per the plan. Design-check screenshots not captured; layout follows the mockup's hero plus card grid using design tokens.

CODE-REVIEW: self-review — no sub-agent run; checked link uniqueness per route and absence of "not found" text in placeholders.
