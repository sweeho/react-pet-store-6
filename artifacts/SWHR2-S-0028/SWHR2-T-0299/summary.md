# Summary — SWHR2-T-0299 Supplier inventory

Built the stock table, service, two supplier routes, the signed-in supplier home and the `/supplier/inventory` page.

- `sup_inventory` (`db/schema.ts`, migration `0007`); demo stock of 10000 per catalog item in `db/client.ts` (outside Vitest).
- `services/supplier/inventory.ts`: `listInventory` (natural order), `updateInventory` (upsert + one `supplier.inventory-changed` message in one transaction), `reduceStock`.
- `routes/api/supplier/inventory.{get,post}.ts` behind `requireSupplier`; negative, fractional or non-numeric marked quantities give 400 `InvalidQuantity` and save nothing; unmarked and blank rows are ignored.
- Pages: `src/pages/supplier/index.tsx` (Display Inventory, Logout), `src/pages/supplier/inventory.tsx`.
- Tests: service, route, page, home, `e2e/supplier-inventory.spec.ts`.

AC coverage: stock record uniqueness/mandatory quantity (C-0044/45), listing (C-0041), mixed rows (C-0042), batch (C-0043). C-0255/C-0256 pass via the supplier home and sign-on routes.

Deviations (per PLAN): confirmation is in-page; the mockup header/rail is the existing shell. Design check: the mockup text, columns, controls and states were followed; no Playwright side-by-side screenshots were produced, so none are claimed.

Verification: `bun run lint` 0, `bun run typecheck` 0, `bun run test` 321 passed.

CODE-REVIEW: self-review — sub-agent not run; checked diff for minimality, transaction atomicity and the 400 path.
