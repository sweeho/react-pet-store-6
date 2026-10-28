# PLAN — SWHR2-T-0081 · Site shell 1: Boilerplate

Change: `swhr2-i-0002-bootstrap-landing-page-and`. Requirements: Shared page layout (SWHR2-R-0290), Landing page (SWHR2-R-0288). Tasks 1.1, 1.2.

## Objective

Brand the existing scaffold as Pet Store and give it the mockups' tokens and font, so the shell, frames and landing page build on them. Keep the root-route smoke test green.

## Steps

1. Read the change's `design.md`, especially "Stack choices" and "Planning findings" → P4.
2. Set the app name and title: `package.json` `name` → `pet-store`, and `index.html` `<title>` → `Pet Store`.
3. Font: replace Space Grotesk with Inter (400/500/600/700) in `configs/fonts.config.ts` and point the sans font token at it.
4. Tokens in `src/index.css` (`:root`, `.dark`, `@theme inline`): brand indigo `#4f46e5` → `--primary` / `--ring` / `--sidebar-primary`, slate neutrals for `--foreground` (#0f172a), `--muted-foreground` (#64748b), `--border`/`--input` (#e2e8f0) and `--muted`/`--sidebar` (#f8fafc). Use OKLCH like the existing tokens. Fix the light-mode `--destructive-foreground` duplicate (DESIGN.md known bug).
5. `e2e/smoke.spec.ts`: keep the root-route test (ok response, visible h1, no console errors) as task 1.2's smoke test. Change it only if the token or font work breaks it.

## File/module ownership

`package.json` (name only), `index.html`, `configs/fonts.config.ts`, `src/index.css`, `e2e/smoke.spec.ts`.

## Definition of Done

AC-1, AC-2, AC-3 on the ticket. The existing unit, E2E and smoke suites stay green; `e2e/home.spec.ts` still asserts the old hero and may stay as is (SWHR2-T-0082 rewrites it).

## Design reference

Mockups are committed under `artifacts/SWHR2-S-0006/design/` (index: `MANIFEST.md`), all at a 1440px viewport. Render the route beside the mockup to check your work. Mockup `mockup-site-shell.html` (SWHR2-MCK-2) at any route shows the tokens and font in use. Read the colours from its `:root` block.
