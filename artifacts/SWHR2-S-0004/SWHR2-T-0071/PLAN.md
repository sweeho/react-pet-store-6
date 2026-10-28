# PLAN — SWHR2-T-0071 · Site shell 3 — Shared page layout and global navigation

Change: `swhr2-i-0002-bootstrap-landing-page-and` · Requirements: **Shared page layout** (SWHR2-R-0290), **Global navigation** (SWHR2-R-0289) · tasks.md group 3 (3.1, 3.2) · Test cases: SWHR2-C-0273, SWHR2-C-0274, SWHR2-C-0275, SWHR2-C-0276

## Objective

Every page — including `/`, `/about`, `/users` and the not-found page — renders inside one `AppShell` with a header, one global navigation (left rail) and a footer, styled per SWHR2-MCK-2.

## Steps

1. Design-system tokens (DESIGN.md §Tokens, §Layout): set the light-theme `--primary` / `--ring` to the indigo brand and the neutrals to the slate ramp in `src/index.css`; switch `configs/fonts.config.ts` to Inter and set it as the sans font. Fix the known light-mode `--destructive-foreground` bug while in the file.
2. `src/components/shell/AppShell.tsx` (design.md §Target design → App shell): default export, props `{ children, header? }`. Renders exactly one `<header>` (banner: store name linking to `/`, optional header slot, static "Sign in" link to `/petstore/signin` per SD5), `GlobalNav`, exactly one `<main>` holding `children`, and one `<footer>` (contentinfo). Grid per MCK-2: 240px rail + content, 56px header, 40px footer.
3. `src/components/shell/GlobalNav.tsx`: `<nav aria-label="Global">` driven by `src/constants/areas.ts`, grouped Shop / Account / Administration / Supplier, with a Home link to `/` first. Mark the active entry with `aria-current="page"`; visible focus ring on every link.
4. Root layout (SD1): in `src/main.tsx` wrap the generated routes in one layout route whose element is `<AppShell><Outlet /></AppShell>`. Remove the self-drawn full-screen chrome from `src/pages/about.tsx`, `src/pages/users/*.tsx` and `src/pages/NotFound.tsx` only where it duplicates the shell (no second header/footer, no `min-h-screen` wrappers).
5. UI tests: `AppShell.test.tsx` and `GlobalNav.test.tsx` next to the components; export both from `src/components/shell/index.ts`.

## File/module ownership

- `src/index.css`, `configs/fonts.config.ts`
- `src/components/shell/AppShell.tsx`, `GlobalNav.tsx`, `index.ts`, and their `*.test.tsx` (new)
- `src/components/index.ts` (re-export)
- `src/main.tsx`
- `src/pages/about.tsx`, `src/pages/NotFound.tsx`, `src/pages/users/profile.tsx`, `src/pages/users/[id].tsx` (chrome removal only)
- `src/constants/areas.ts` (read; edit only to add a field the nav needs)

## Fixed interface contracts

- `AppShell` is the default export of `src/components/shell/AppShell.tsx` and renders its `children` inside `<main>` (imported by the acceptance suite).
- `src/pages/users/index.tsx` is NOT edited here — SWHR2-T-0072 owns it.

## Definition of Done

- AC-1 and AC-2 met; SWHR2-C-0273, C-0274, C-0276 (`tests/acceptance/site-shell/e2e/shell.spec.ts`) and SWHR2-C-0275 (`tests/acceptance/site-shell/shell.test.tsx`) pass.
- C-0270, C-0271, C-0272 still pass.

## Design reference

Mockups are committed under `artifacts/SWHR2-S-0004/design/` (index: `MANIFEST.md`), all at a 1440px viewport. Render the route beside the mockup to check your work.

- `mockup-site-shell.html` (SWHR2-MCK-2) → the chrome on any route (e.g. `/`, `/about`), default state, 1440px. The drawn content (a category in loading state) is not this ticket's.
