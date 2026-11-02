# PLAN — SWHR2-T-0299 Supplier inventory

Change: `swhr2-i-0010-supplier-inventory`. Read its `design.md` first: § Target design, then § Planning (SWHR2-S-0028) for findings F1–F7, spec discrepancies SD1–SD7, decisions P1–P5 and phases. Then read `specs/supplier-inventory/spec.md` and the locked tests in `tests/acceptance/supplier-inventory/`, which fix the route files, the table and the request shape.

## Objective

A signed-in supplier opens Supplier inventory from the supplier home and sees every item's stock. They can overwrite the counts of the rows they mark in one Submit. Each change commits together with one `supplier.inventory-changed` message for order-fulfilment.

## Steps

1. `sup_inventory` in `db/schema.ts` and migration 0007 (design.md P1, SD2). Tasks 1.1, 1.2. Seed demo stock in `db/client.ts` (P6).
2. `services/supplier/inventory.ts`: `listInventory`, `updateInventory`, `reduceStock` (P2, SD4, SD5). Tasks 1.3–1.5, 3.x, 4.x.
3. `routes/api/supplier/inventory.get.ts` and `inventory.post.ts` (P3, SD1, SD3). Tasks 2.x, 6.1.
4. Supplier home signed-in state (P4) and `/supplier/inventory` page (P5, SD6, SD7), built against the mockups below. Tasks 5.x.
5. Colocated tests and `e2e/supplier-inventory.spec.ts` (design.md Phases 4–5). Tasks 7.x.

## File/module ownership

Create:

- `services/supplier/inventory.ts` and its test
- `routes/api/supplier/inventory.get.ts`, `routes/api/supplier/inventory.post.ts`, `routes/api/supplier/inventory.test.ts`
- `src/pages/supplier/inventory.tsx` and its test
- `drizzle/0007_*.sql` and `drizzle/meta/**`
- `e2e/supplier-inventory.spec.ts`

Modify:

- `db/schema.ts` (append `supInventory`)
- `db/client.ts` (demo stock block, P6)
- `src/pages/supplier/index.tsx` and `src/pages/supplier/index.test.tsx`

Do not edit: `tests/acceptance/**`, `openspec/**`, `services/supplier/fulfil.ts` and `services/supplier/orders.ts` (order-fulfilment's).

## Design reference

Mockups are in `artifacts/SWHR2-S-0028/design/` (see `MANIFEST.md`), drawn at 1440×900 with the supplier signed in:

- `mockup-supplier-home.html` (SWHR2-MCK-32): route `/supplier`, signed-in state, with Display Inventory and Logout.
- `mockup-supplier-inventory.html` (SWHR2-MCK-33): route `/supplier/inventory`, with EST-1 and EST-2 marked and EST-6 typed but unmarked.

Known deviations, decided in advance:

- The mockups draw their own header and rail; the page sits in the existing shell.
- The confirmation after Submit is in-page (SD6).

## Definition of Done

- AC-1 to AC-5 on the ticket, one per scenario.
- Linked cases SWHR2-C-0041 to SWHR2-C-0045 pass in the locked suite, and so do the deferred sign-on cases SWHR2-C-0255 and SWHR2-C-0256.
- The supplier steps of the locked sign-on e2e keep passing.
