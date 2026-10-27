# Summary — SWHR2-T-0010

Landing page at `/` linking every primary area.

- `src/constants/navigation.ts`: `NavGroup`, `NavArea`, `NAV_AREAS` (9 entries, per contract).
- `src/pages/index.tsx`: replaces the boilerplate hero with "Welcome to Pet Store" and a card grid, one link per `NAV_AREAS` entry, staff pill on staff areas.
- `src/components/shell/AreaPlaceholder.tsx` + 9 stub pages under `src/pages/{petstore,admin,supplier}` so every link opens its own page; capabilities replace them.
- Tests: `src/pages/index.test.tsx`; `e2e/home.spec.ts` rewritten (old hero tests no longer apply).

Deviations: mockup header, rail, footer and category cards belong to the shell / catalog tickets and are not built; the hero "Browse the catalog" button is omitted so `/petstore` has exactly one link. Landing and stubs render their own `<main>`; the shell ticket should move that into `AppShell`. No design-check screenshots: no Chromium in this container, E2E not run.

Verification: `bun run verify` passes (37 tests).
