## 1. Order queries

- [ ] 1.1 Implement retrieval of purchase orders between a start and end instant, both bounds inclusive
- [ ] 1.2 Implement listing of orders by exact current status, each order at most once
- [ ] 1.3 Implement the order-list response with id, user id, order date, amount, status and per-status count
- [ ] 1.4 Load order data for PENDING, APPROVED, DENIED and COMPLETED and combine the results

## 2. Sales aggregation

- [ ] 2.1 Compute revenue per category as the sum of quantity times unit price over line items in the range
- [ ] 2.2 Compute the sales count per category as the sum of line-item quantities in the range
- [ ] 2.3 Return the total revenue and total count alongside the per-category figures
- [ ] 2.4 Implement the per-item breakdown when a request names a category
- [ ] 2.5 Confirm with the SME whether denied and pending orders count toward revenue and sales
- [ ] 2.6 Confirm with the SME whether the end date includes the whole end day

## 3. Chart data handling

- [ ] 3.1 Discard chart entries with no name or a negative or unreadable value
- [ ] 3.2 Compute chart totals from the remaining entries

## 4. Date entry

- [ ] 4.1 Parse chart start and end dates in MM/dd/yyyy format
- [ ] 4.2 Show "Dates must be in the format of MM/dd/yyyy" and skip the request when a date is unreadable
- [ ] 4.3 Request chart data immediately when both dates are valid
- [ ] 4.4 Set the default chart range (confirm the 2001-2002 default with the SME)

## 5. Non-pending orders screen

- [ ] 5.1 Build the View Non-Pending Orders list of APPROVED, COMPLETED and DENIED orders
- [ ] 5.2 Show ID, user ID, date, amount and status columns, displaying -1 for a non-numeric ID
- [ ] 5.3 Make the list sortable by clicking any column header
- [ ] 5.4 Keep the list read-only with no status-changing control

## 6. Sales charts screen

- [ ] 6.1 Build the Orders and Sales views selectable from the View menu and the toolbar, opening on Orders
- [ ] 6.2 Build the Pie Chart tab with description, Start Date, End Date and Get Data
- [ ] 6.3 Render the revenue pie chart with legend and hover text showing category and percentage to two decimals
- [ ] 6.4 Build the Bar Chart tab with description, Start Date, End Date and Get Data
- [ ] 6.5 Render the sales-count bar chart scaled to the largest category with 5 y-axis ticks and "<n> orders" hover text

## 7. Load and refresh

- [ ] 7.1 Load order lists and both charts when the administration tool starts
- [ ] 7.2 Reload order lists and both charts on Refresh
