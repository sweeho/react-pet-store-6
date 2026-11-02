# PLAN — SWHR2-T-0295 Order approval

Change: `swhr2-i-0009-order-approval`. Read its `design.md` first: § Target design, then § Planning (SWHR2-S-0027) for findings F1–F7, spec discrepancies SD1–SD10, decisions P1–P6 and phases. Then `specs/order-approval/spec.md` and the locked tests in `tests/acceptance/order-approval/`, which fix module names and shapes.

## Objective

Small en_US and ja_JP orders approve themselves on receipt. Administrators decide the rest on `/admin/tool` and commit them as one batch, which travels on the durable `order.approval` channel to order processing.

## Steps

1. Move the outbox to `services/messaging/` with `processDue`, `delivered` and `available_at`, plus migration 0006 (design.md P1, SD2). Update `services/orders/place.ts`, `plugins/order-worker.ts` and `services/orders/receive.test.ts`.
2. `services/orders/approval.ts#autoApproves` and the receipt step `receiveOrder(doc)` (P2, SD1). Tasks 1.1–1.4.
3. `services/orders/decide.ts`: approval document, `applyDecision`, `decideBatch`, registered on `order.approval` (P3). Tasks 2.1, 2.3.
4. Admin routes: orders list, decisions, sales revenue and order-count (P4, P5, SD7, SD9). Task 2.2.
5. Tool page and its components (P6, SD3–SD6, SD8, SD10), built against the mockups below. Tasks 3.x, 4.x, 5.x.
6. Colocated tests per phase 5, and `e2e/order-approval.spec.ts` (phase 6, task 6.1). The order may be created through the storefront checkout or by enqueuing an `order.new` document. Use any en_US total above 500.

## File/module ownership

Create: `services/messaging/index.ts`, `services/messaging/worker.ts`, `services/orders/approval.ts`, `services/orders/decide.ts`, `routes/api/admin/orders/index.get.ts`, `routes/api/admin/orders/decisions.post.ts`, `routes/api/admin/sales/revenue.get.ts`, `routes/api/admin/sales/order-count.get.ts`, `src/pages/admin/tool.tsx`, `src/components/admin/**` (including `OrderTable.tsx`), `drizzle/0006_*.sql` + `drizzle/meta/**`, `e2e/order-approval.spec.ts`, and colocated `*.test.ts(x)` beside each of these.
Modify: `db/schema.ts` (messages), `services/orders/receive.ts`, `services/orders/receive.test.ts`, `services/orders/place.ts`, `plugins/order-worker.ts`, `package.json` + `bun.lock` (`recharts`), `src/index.css` only if needed.
Delete: `services/messages/`.
Do not edit: `tests/acceptance/**`, `openspec/**`.

## Design reference

Mockups in `artifacts/SWHR2-S-0027/design/` (see `MANIFEST.md`). Every one draws route `/admin/tool`, signed in as administrator, at 1440×900:

- `mockup-order-approval-pending-tab.html` (SWHR2-MCK-28): Pending tab with 3 uncommitted marks.
- `mockup-order-approval-refresh-with-uncommitted-.html` (SWHR2-MCK-29): Refresh pressed with marks. The native confirm replaces the drawn dialog (SD3).
- `mockup-order-approval-busy-while-talking-to-the.html` (SWHR2-MCK-30): Commit in flight, "Updating data on the server...".
- `mockup-order-approval-non-pending-tab.html` (SWHR2-MCK-31): Non-pending tab.

Known deviations, decided in advance: SD3 (native confirm), SD4 (About, Exit, charts), SD5 (upper-case status), SD10 (header labels).

## Definition of Done

AC-1 to AC-23 on the ticket, one per scenario. Every linked case, C-0228 to C-0250, passes in the locked suite. The existing checkout and shopping-cart acceptance tests keep passing.
