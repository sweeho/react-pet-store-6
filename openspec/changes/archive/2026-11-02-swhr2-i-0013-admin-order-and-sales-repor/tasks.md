## 1. Order queries

- [x] 1.1 Implement listing of orders by exact current status, each order at most once, with no ordering or paging (SWHR2-T-0317; SWHR2-R-0143)
- [x] 1.2 Return order id, user id, order date as M/D/YYYY, order value and status for each listed order (SWHR2-T-0317; SWHR2-R-0113)
- [x] 1.3 Return an empty list when no order is in the requested status (SWHR2-T-0317; SWHR2-R-0113)

## 2. Sales chart data

- [x] 2.1 Set the default chart range to 1 January 2001 through 31 December 2002 (confirm the default with the SME) (SWHR2-T-0317; SWHR2-R-0026)
- [x] 2.2 Break revenue and sales figures down per item when a request names a category (SWHR2-T-0317; SWHR2-R-0025)
- [x] 2.3 Keep per-category figures when no category is named (SWHR2-T-0317; SWHR2-R-0025)
- [x] 2.4 Confirm with the SME whether the per-item breakdown must be reachable from the user interface (SWHR2-T-0317; SWHR2-R-0025)

## 3. Load and refresh

- [x] 3.1 Load order lists and both charts when the administration tool starts (SWHR2-T-0317; SWHR2-R-0112)
- [x] 3.2 Reload order lists and both charts on Refresh (SWHR2-T-0317; SWHR2-R-0112)
- [x] 3.3 Build the Orders view (non-pending and pending tabs) and Sales view (pie and bar chart tabs), opening on Orders (SWHR2-T-0317; SWHR2-R-0112)

## 4. Non-pending orders screen

- [x] 4.1 Build the View Non-Pending Orders list of approved, denied and completed orders, excluding pending orders (SWHR2-T-0317; SWHR2-R-0110)
- [x] 4.2 Load the non-pending list through the Refresh action (SWHR2-T-0317; SWHR2-R-0110)

## 5. Order list columns

- [x] 5.1 Show ID, user ID, order date, amount and status columns in both order lists (SWHR2-T-0317; SWHR2-R-0111)
- [x] 5.2 Make both lists sortable by clicking any column header (SWHR2-T-0317; SWHR2-R-0111)
- [x] 5.3 Display -1 for a non-numeric order ID (SWHR2-T-0317; SWHR2-R-0111)
