# Summary — SWHR2-T-0278 QA rework round 1

Fixes the four cases red in the official run at 5cd523c. Two causes, each fixed once.

## Changes

- `services/catalog/data-access.ts`, `services/catalog/index.ts`: the locked acceptance suite configures catalog data access with `CATALOG_DAO_CLASS` / `CATALOG_DAO_DATABASE` and `registerDialect(name, sqliteClient)`; the code only knew `CATALOG_DATA_ACCESS` / `CATALOG_DB_DIALECT`. Both names are now read (legacy names kept), the dialect check is skipped for a double that declares none, and the configured dialect picks the registered SQLite connection. Covers C-0280, C-0281, C-0282.
- `src/pages/petstore/cart.tsx`: the cart now loads in the route chunk (top-level await, so the browser's load event waits) and the first render uses the reply and its locale. The acceptance test reads `innerText` right after `goto`, and the old chain (session, locale, cart refetch) lost the race. Covers C-0022.
- `e2e/global-setup.ts`: warms the item, cart and change-language routes so a test's first visit does not pay the compile.

## Verification

- `bun run lint`, `bun run typecheck`, `bun run build`: exit 0. `bun run test`: 240 passed.
- `bun run test:acceptance -- tests/acceptance/catalog-browsing`: 6 files, 29 tests pass (before: data-access.test.ts 3 of 3 failed).
- `bun run test:acceptance:e2e -- .../localization.spec.ts`: C-0022 passed in 5 of 5 full-file runs (before: failed in about half). C-0021, C-0026, C-0028 and C-0039 in that file also fail locally and are not in this ticket.
- `bun run test:e2e -- --project=chromium`: 15 passed.
- Platform red run 3769ce61 at e4a9c83: all four cases already passing in the platform's own run (it runs the colocated unit tests, not the locked acceptance files).
