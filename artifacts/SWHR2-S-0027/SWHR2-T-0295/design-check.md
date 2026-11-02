# Design check — SWHR2-T-0295

Route `/admin/tool`, 1440×900. The pending-tab mockup (SWHR2-MCK-28) was implemented as the primary design and compared by screenshot. The other three mockups (refresh warning, busy, non-pending) draw the same page in other states and were checked through the locked and colocated tests, not by screenshot.

| Mockup                                                | Mockup screenshot                 | Built screenshot                 |
| ----------------------------------------------------- | --------------------------------- | -------------------------------- |
| SWHR2-MCK-28 `mockup-order-approval-pending-tab.html` | `design-check/mockup-pending.png` | `design-check/built-pending.png` |

## Differences left

- **Shell.** The mockup draws its own header, search, language switch and "Store staff" rail; the built page sits in the existing app shell. The shell is not part of this ticket.
- **Status text.** Upper-case stored value (`PENDING`, `APPROVED`, `DENIED`) in a badge with Tailwind palette classes, no dot (SD5, SD6; DESIGN.md § Status colours).
- **Status dropdown.** The mockup draws a select caret on each status; the built row shows the badge only. Decisions are made with the row tick box and the Approve/Deny buttons, as the locked tests drive them.
- **Controls the mockup lacks.** About and Exit buttons, and two chart panels with Start/End date and Submit below the table (SD4). "Log out" and "Signed in as" are not drawn; Exit signs out.
- **Refresh warning.** Native browser confirm, not the drawn dialog (SD3).
- **Sample data.** Amounts are shown with two decimals for every locale; the mockup shows ja_JP amounts without decimals. Locale formatting is not specified.
- **Table header.** "Order ID" kept for the pending table (SD10); the non-pending table uses "ID".
- **Not drawn.** The "loaded 10:42" time in the bottom bar.
