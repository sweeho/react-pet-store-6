# PLAN — SWHR2-T-0010

PLAN.md was absent from the branch (ticket description was a placeholder); self-authored from the ticket's acceptance criteria and `mockup-landing-page.html`.

1. Red: `src/pages/index.test.tsx` (C-0271) and `e2e/landing.spec.ts` (C-0270, C-0272); `src/constants/navigation.ts` types + empty `NAV_AREAS` stub. Replace the boilerplate hero tests in `e2e/home.spec.ts`.
2. `NAV_AREAS`: nine entries keyed by capability slug (hrefs per ticket AC).
3. `src/pages/index.tsx`: landing page (heading, "Everything in the store" grid of area cards from `NAV_AREAS`, staff pill). The mockup's header, rail, footer and category cards belong to the shell / catalog tickets and are not built here.
4. `AreaPlaceholder` component plus one stub page per NAV_AREAS href so no link lands on the not-found page; later capabilities replace the stubs.
5. Gate: `bun run verify:full`.
