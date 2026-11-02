# Summary — SWHR2-T-0295 Order approval

CODE-REVIEW: self-review — read the full diff against the plan and DESIGN.md; found and fixed that both charts must share one date range (locked C-0241); rejected a per-row status dropdown (locked tests drive tick boxes plus Approve/Deny).

## What changed

- Outbox moved from `services/messages` to `services/messaging` (`enqueue`, `processDue`, `startWorker`); statuses `pending | delivered | failed`, `available_at` column, a failing handler retries after 30 s. Migration `drizzle/0006_cool_mojo.sql`, hand-edited to copy `done` rows as `delivered`.
- `services/orders/approval.ts#autoApproves` (en_US < 500.00, ja_JP < 50000). `receiveOrder(doc)` stores, starts PENDING, then applies the rule in one transaction; the `order.new` handler decodes the XML and calls the same step.
- `services/orders/decide.ts`: approval XML document (free-text status), `applyDecision`, `decideBatch`, registered on `order.approval`.
- Routes: `GET /api/admin/orders`, `POST /api/admin/orders/decisions` (202, one message), `GET /api/admin/sales/{revenue,order-count}` (`services/orders/sales.ts`).
- `/admin/tool` page and `src/components/admin/*` (tabs, tables, status badge, recharts charts). `recharts` added.
- `e2e/order-approval.spec.ts`; colocated tests in `services/orders`, `routes/api/admin/orders`, `src/pages/admin`.

## Deviations

- Refresh requests all lists at once and the actions re-enable when the pending list reply is applied (locked C-0237 releases only one held request).
- One Start/End range drives both charts (locked C-0241).
- Colocated tests use `services/orders/approvalHarness.ts`, a copy of the acceptance harness, because `tsc` cannot include `tests/acceptance`.
- Design differences: `design-check.md`.

## AC coverage

AC-1 to AC-23: cases C-0228 to C-0250, green in the recorded run.

## Verification

`bun run verify` (lint, typecheck, unit), `bun run test:e2e`, and the locked order-approval acceptance e2e; results in the work log.
