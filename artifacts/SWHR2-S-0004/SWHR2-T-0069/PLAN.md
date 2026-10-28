# PLAN — SWHR2-T-0069 · Site shell 1 — Boilerplate

Change: `swhr2-i-0002-bootstrap-landing-page-and` · Requirement: **Landing page** (SWHR2-R-0288) · tasks.md group 1 (1.1, 1.2) · Test case: SWHR2-C-0270

## Objective

Extend the existing scaffold so the app identifies as the Pet Store, and make the smoke test prove that the root route serves the landing page. Nothing is re-scaffolded (design.md §Decisions "Existing boilerplate wins"; §Sprint planning → Codebase findings).

## Steps

1. Branding: set the document title in `index.html` to "Pet Store" and replace the placeholder `STORE_NAME` in `src/constants/index.ts` with "Pet Store" (the landing page and shell read it in later phases).
2. Smoke: extend `e2e/smoke.spec.ts` so the root-route test asserts the URL stays `/`, a level-1 heading is visible, no not-found text is shown, and no console errors fire. Keep the two API probes as they are. Assert on a level-1 heading, not on copy, because phase 2 replaces the hero copy.
3. Leave build, test and CI tooling alone unless a step above needs it (design.md §Sprint planning → CI phase).

## File/module ownership

- `index.html`
- `src/constants/index.ts`
- `e2e/smoke.spec.ts`

## Definition of Done

- AC-1 met; SWHR2-C-0270 in `tests/acceptance/site-shell/e2e/shell.spec.ts` passes.
- The smoke spec has been run, not just written.

## Design reference

Mockups are committed under `artifacts/SWHR2-S-0004/design/` (index: `MANIFEST.md`), all at a 1440px viewport. Render the route beside the mockup to check your work.
No mockup applies to this ticket: it changes no visible screen beyond the document title.
