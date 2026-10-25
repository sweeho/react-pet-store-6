## Why

The legacy Java Pet Store (1.3.2) gives store administrators a rich-client administration tool that lists orders by status and charts revenue and sales per product category over a date range. Its rules sit in the client, the admin servlet and the order processing centre facade and were never written down beyond a short user guide: which statuses count as "non-pending", what the revenue and sales figures are summed from, how report dates are entered and defaulted, and how bad data is handled. The rebuild has to reproduce that behaviour, or knowingly change it, so it is captured here as a specification extracted from the legacy source (spec extraction SX-0001).

## What Changes

- Adds the `sales-reporting` capability as 7 requirements (5 behavioural, 2 screens), one per SME-approved IR record, each carrying its requirement key.
- Covers: orders by exact status, the order details returned per status, the default chart date range, per-item drill-down within a category, load-on-start/refresh with the Orders and Sales views, the non-pending orders screen and the order-list columns and sorting.
- The revenue and sales-count reports, date-entry validation, chart totals and the date-range finder are pending SME review and are not specified yet; see the recommendations file.

## Open points for the SME / Business Owner

- **"Orders" chart counts units, not orders.** The facade sums line-item quantities; the screen labels the figure "orders". The spec states the computed figure; the label conflict goes to Intent.
- **Revenue includes every order in the range regardless of status**, denied orders included. Recorded as current behaviour; whether that is right belongs in the defect register.
- **End date is effectively exclusive.** Dates are converted to midnight at the start of the day, so orders placed on the end date after 00:00 are left out. Suspected legacy defect.
- **Per-item drill-down is unreachable** from the shipped client (`unresolved-reachability`).
- **Default range 2001-2002** is a demo literal contradicted by its own comments (low confidence).
- **Record key `SALES-REQ-0001` is used by three different records** in three pass files; the processmanager/a variant is taken as the approved one (design.md D8).

## Capabilities

### New Capabilities

- `sales-reporting`: administrator views of orders by status and sales/revenue charts over date ranges.

### Modified Capabilities

- none

## Impact

- Depends on order data owned by order processing (purchase orders and line items, order status). The "Process Pending Orders" tab shares the Orders view but its approve/deny behaviour belongs to `order-approval`.
- Access control of the administration area belongs to `sign-on`; its finding that the admin data endpoint is not role-protected affects every report here.
- User interface: two screen requirements (non-pending orders screen, order-list columns and sorting).
