## Context

Defect SWHR2-T-0328. `e2e/order-approval.spec.ts` (case SWHR2-C-0243, project e2e, not a locked suite):

1. signs in as `j2ee` and orders 100 × EST-1 (en_US, above the auto-approval threshold, so PENDING)
2. waits for the order in the pending view
3. marks it approved and commits
4. opens the non-pending tab and polls Refresh until the row contains "APPROVED", with a 30 s test timeout

## Root cause

Verified in code:

- **Commit only enqueues.** `POST /api/admin/orders/decisions` enqueues `order.approval`. The worker (`services/messaging/worker.ts`, started by `plugins/order-worker.ts`, polling every 500 ms) then runs this chain:
  1. `decideBatch` sets APPROVED and enqueues `supplier.purchase-order` (`services/orders/decide.ts`).
  2. `receiveSupplierPurchaseOrder` → `fulfilOrder` ships every line the stock covers and publishes `supplier.invoice` (`services/supplier/fulfil.ts`).
  3. `handleInvoice` sets the workflow COMPLETED when every line has shipped (`services/orders/invoice.ts`).
- **Each hop is a separate pending row**, consumed on a later poll. So APPROVED lasts only about one to three worker ticks.
- **Stock always covers the order.** `db/seed/petstore.json` stocks EST-1 at 10000, and the Playwright web server re-seeds before it starts, so the 100-unit order is always fulfillable and always reaches COMPLETED.
- **Why load matters.** The spec's poll clicks Refresh, waits for four order lists to load, then checks the row for up to 1 s. Under a full `fullyParallel` run on one dev server and one `sqlite.db`, each refresh is slow enough that the first refresh after the decision often already sees COMPLETED. After that "APPROVED" never appears and the spec times out at 30 s. Run alone, a refresh lands inside the APPROVED window.
- **The behaviour is correct.** The spec pins a transient status. The specified scenario SWHR2-R-0087.02 ("appears … with status APPROVED") describes an order that has not yet been fulfilled, and nothing specified what the view shows once it has.

## Decisions

- **D1 Fix the test, not the pipeline.** Delaying fulfilment, pausing the worker, or giving the e2e server a special mode would change product behaviour to suit a test.
- **D2 Assert the stable outcome.**
  - After commit, the spec polls Refresh on the non-pending tab until the order's row is present with a status matching APPROVED or COMPLETED.
  - It then asserts the row does not read PENDING or DENIED, which proves the approval decision was recorded.
  - It also asserts that the order is no longer in the pending tab.
  - The earlier "stays PENDING until approved" assertions are unchanged.
- **D3 Rejected: make the order unfulfillable** (ordering more than the 10000 in stock) so it stays APPROVED. It leaves a waiting supplier order in the shared database that `e2e/supplier-inventory.spec.ts`'s restock re-fulfils at an unpredictable time, which brings the race back. It also depends on the cart accepting that quantity.
- **D4 Rename the test title.** The title should describe the stable outcome ("…after commit and refresh it is listed as approved or completed"), and the `[SWHR2-C-0243]` tag stays.

## Verification

- The spec passes alone and inside full `bun run test:e2e` runs, repeated several times on the ticket branch.
- No other spec changes.
