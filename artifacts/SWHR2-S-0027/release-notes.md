---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0027
capability_brief: SWHR2-I-0009
branch: vortex/sprint/swhr2-s-0027-dd099d53
upstream: [artifacts/SWHR2-S-0027/qa-test-report.md]
---

# Release notes — SWHR2-S-0027

## Added

- **Automatic approval of small orders.** A new order is recorded as PENDING first, then approved automatically if it is a US order under 500 or a Japanese order under 50,000. An order of exactly 500 (or 50,000), and every order in any other language, including Chinese, waits for an administrator. (SWHR2-T-0295)
- **Order approval tool** at `/admin/tool`, for signed-in administrators. (SWHR2-T-0295)
  - **Pending** tab: orders still waiting, with order ID, customer, date, amount and status, each column sortable. Tick orders and mark them Approved or Denied. Status is colour-coded: Pending yellow, Approved green, Denied red.
  - **Non-pending** tab: Approved, Denied and Completed orders, reloaded by Refresh.
  - **Commit** sends all marked decisions together as one batch; the administrator does not wait for order processing.
  - **Refresh** with uncommitted marks first asks "Data is not committed. Are you sure you want to refresh?" and discards the marks only on confirmation.
  - While the page talks to the server, every action is disabled and "Retrieving data from the server..." or "Updating data on the server..." is shown.
  - Revenue and order-count charts over a Start/End date range, plus About and Exit.
- **Durable decisions.** A committed batch stays queued until order processing takes it; a failed attempt is retried. (SWHR2-T-0295)

## Changed

- Orders placed at checkout no longer all wait as PENDING: small US and Japanese orders now approve themselves. (SWHR2-T-0295)

## Fixed

- None.

## Upgrade notes

- Database migration `drizzle/0006_cool_mojo.sql` rebuilds the `messages` outbox table with an `available_at` column and statuses `pending | delivered | failed`; existing `done` rows become `delivered`. Run it before starting the new build.
- The in-process worker now also consumes the `order.approval` channel. Keep the server at one process (`instances: 1`).
- New API, administrator only: `GET /api/admin/orders`, `POST /api/admin/orders/decisions` (202), `GET /api/admin/sales/revenue`, `GET /api/admin/sales/order-count`.
- New dependency: `recharts`, for the sales charts.

## Not included

- Fulfilment, invoicing and customer e-mails after approval; approved orders wait for order fulfilment (a later capability).
- The per-row status dropdown and in-page refresh dialog drawn in the mockups; see Known Issues in `sprint-summary.md`.
