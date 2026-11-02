# Design check — SWHR2-T-0295

Route `/admin/tool`, 1440×900, administrator signed in; the admin API is faked in the browser with the sample orders below. Screenshots are in `design-check/`.

Differences common to all four mockups, left on purpose:

- **Shell.** The mockups draw their own header, search, language switch and "Store staff" rail; the built page sits in the existing app shell. The shell is not part of this ticket.
- **Status text.** Upper-case stored value (`PENDING`, `APPROVED`, `DENIED`, `COMPLETED`) in a badge with Tailwind palette classes, no dot (SD5, SD6; DESIGN.md § Status colours).
- **Controls the mockups lack.** About and Exit buttons, and two chart panels with Start/End date and Submit below the table (SD4). "Log out" and "Signed in as" are not drawn; Exit signs out.
- **Sample data.** Amounts are shown with two decimals for every locale; the mockups show ja_JP amounts without decimals. Locale formatting is not specified.
- **Bottom bar.** The "loaded 10:42" time is not drawn.

## SWHR2-MCK-28 — Pending tab (`mockup-order-approval-pending-tab.html`)

Mockup `design-check/mockup-pending.png`, built `design-check/built-pending.png`. Layout, tabs with counts, toolbar, table, legend and "3 decisions not committed" bar match. Left: the per-row status dropdown caret is not drawn; decisions are made with the row tick boxes and Approve/Deny, as the locked tests drive them. Pending header stays "Order ID" (SD10).

## SWHR2-MCK-29 — Refresh with uncommitted decisions (`mockup-order-approval-refresh-with-uncommitted-.html`)

Mockup `design-check/mockup-refresh.png`, built `design-check/built-refresh.png` (taken after the warning was dismissed; a native dialog cannot be captured). Left: the warning is the native browser confirm with the spec text "Data is not committed. Are you sure you want to refresh?", not the drawn in-page dialog (SD3). Behind it the marks stay as in the mockup.

## SWHR2-MCK-30 — Busy while talking to the server (`mockup-order-approval-busy-while-talking-to-the.html`)

Mockup `design-check/mockup-busy.png`, built `design-check/built-busy.png`. Refresh, Commit, About, Exit, Approve, Deny and both Submit buttons are disabled and "Updating data on the server..." shows under the header. Left: the status line is plain text under the header, not the mockup's in-bar indicator; the selection is cleared by marking, so the toolbar reads "0 selected".

## SWHR2-MCK-31 — Non-pending tab (`mockup-order-approval-non-pending-tab.html`)

Mockup `design-check/mockup-non-pending.png`, built `design-check/built-non-pending.png`. Approved, denied and completed orders in one read-only table with coloured badges. Left: header is "ID" for this table (SD10, sales-reporting's OrderTable); the build lists approved, denied and completed in status order rather than the mockup's sample order.
