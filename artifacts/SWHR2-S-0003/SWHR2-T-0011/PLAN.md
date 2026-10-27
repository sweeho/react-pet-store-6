# PLAN — SWHR2-T-0011

PLAN.md was absent from the branch (ticket description was a placeholder); self-authored from the ticket's acceptance criteria, design.md and the "Site shell" mockup (design block 04820015).

1. Red: `src/components/shell/AppShell.test.tsx` ([SWHR2-C-0275]) and `e2e/shell.spec.ts` ([SWHR2-C-0273/0274/0276]); `AppShell`/`GlobalNav` stubs throw `VortexNotImplemented`.
2. `src/constants/navigation.ts`: `NAV_AREAS` (label, href, group, icon key, restricted).
3. `GlobalNav.tsx`: `<nav aria-label="Global">` rail from NAV_AREAS (grouped Shop / You / Store staff), includes link to `/`.
4. `AppShell.tsx`: header (banner: brand link to `/`, `headerSlot`, Cart/Account/Sign in), GlobalNav, main, footer (contentinfo); grid 240px rail, 56px header, 40px footer.
5. `src/main.tsx`: wrap `useRoutes(routes)` in `AppShell` so every route, incl. the catch-all, renders in the shell.
6. Landing page: remove its own header/nav/mobile dialog (the shell owns chrome); update its tests and `e2e/home.spec.ts`.
7. Gate: `bun run verify:full`.
