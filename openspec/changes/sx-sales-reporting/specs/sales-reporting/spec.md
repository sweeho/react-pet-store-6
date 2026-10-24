## ADDED Requirements

### Requirement: Orders within a date range

The system SHALL retrieve every purchase order whose order date-time falls between a given start instant and a given end instant, and both bounds MUST be inclusive.

#### Scenario: Orders on and inside the bounds are returned

- **GIVEN** orders placed at exactly the start instant, between the two instants, and exactly at the end instant
- **WHEN** orders between the start and end instants are requested
- **THEN** all three orders are returned

#### Scenario: Orders outside the bounds are excluded

- **GIVEN** an order placed one millisecond before the start instant and another one millisecond after the end instant
- **WHEN** orders between the start and end instants are requested
- **THEN** neither order is returned

### Requirement: Orders by current status

The system SHALL list, for the administrator, every order whose current status exactly equals a given status, and each order MUST appear at most once in the result. No ordering or paging SHALL be applied.

#### Scenario: Orders at the requested status are listed once each

- **GIVEN** three orders currently PENDING and two currently APPROVED
- **WHEN** the administrator requests orders with status PENDING
- **THEN** exactly the three PENDING orders are returned, each once

#### Scenario: Status match is exact

- **GIVEN** orders whose status is APPROVED
- **WHEN** orders with status "approved" (different case) are requested
- **THEN** no orders are returned

### Requirement: Order list data

The system SHALL obtain the administrator's order lists by requesting orders for each of the statuses PENDING, APPROVED, DENIED and COMPLETED, and for each order it MUST return the order id, user id, order date (month/day/year), order amount and order status, together with the count of orders returned for that status.

#### Scenario: Order data is loaded for all four statuses

- **GIVEN** orders exist in each of the statuses PENDING, APPROVED, DENIED and COMPLETED
- **WHEN** the administration tool loads its order data
- **THEN** one request is made per status and the combined result contains every order with its id, user id, order date, amount and status

#### Scenario: Count accompanies each status result

- **GIVEN** four orders currently DENIED
- **WHEN** orders with status DENIED are requested
- **THEN** the response carries those four orders and a total count of 4

### Requirement: Revenue by category report

The system SHALL report revenue for an administrator-chosen date range broken down by product category, where each category's revenue is the sum of quantity times unit price over the line items of that category in orders dated within the range, and the response MUST also carry the total revenue for the range. The administration tool SHALL display the result as a pie chart whose slices are sized by each category's share of total revenue, with a legend of categories, and hovering a slice SHALL show the category name and its percentage of total revenue to at most two decimal places.

#### Scenario: Revenue split across categories

- **GIVEN** orders in the range whose line items total 300.00 in category DOGS and 100.00 in category CATS
- **WHEN** the administrator requests the revenue chart for that range
- **THEN** the response lists DOGS 300.00 and CATS 100.00 with a total of 400.00, and the pie chart shows DOGS as 75% and CATS as 25%

#### Scenario: Hover shows category and rounded percentage

- **GIVEN** a revenue chart in which category FISH holds one third of total revenue
- **WHEN** the administrator hovers over the FISH slice
- **THEN** the text "FISH (33.33%)" is shown

### Requirement: Sales count by category report

The system SHALL report a sales count for an administrator-chosen date range broken down by product category, where each category's count is the sum of line-item quantities of that category in orders dated within the range, and the response MUST also carry the total count for the range. The administration tool SHALL display the result as a bar chart with bars scaled to the largest category, a y-axis of 5 tick marks, and on hover the bar's count shown as "<n> orders".

#### Scenario: Counts per category are charted

- **GIVEN** orders in the range carrying 6 units of category DOGS and 3 units of category BIRDS
- **WHEN** the administrator requests the sales-count chart for that range
- **THEN** the response lists DOGS 6 and BIRDS 3 with a total of 9, and the DOGS bar is twice the height of the BIRDS bar

#### Scenario: Hover shows the count

- **GIVEN** a sales-count chart in which category DOGS has a count of 6
- **WHEN** the administrator hovers over the DOGS bar
- **THEN** the text "6 orders" is shown

### Requirement: Chart date entry validation

The administration tool SHALL accept chart start and end dates only in the format MM/dd/yyyy. WHEN either date cannot be read in that format the tool MUST show the message "Dates must be in the format of MM/dd/yyyy" and MUST NOT request chart data; WHEN both dates are readable the tool SHALL immediately request the chart data for that range. The tool SHALL NOT check that the start date precedes the end date.

#### Scenario: Malformed date is rejected

- **GIVEN** the start date field contains "2002-01-31"
- **WHEN** the administrator requests chart data
- **THEN** the message "Dates must be in the format of MM/dd/yyyy" is shown and no chart data is requested

#### Scenario: Valid dates reload the chart

- **GIVEN** start date "01/01/2002" and end date "06/30/2002"
- **WHEN** the administrator requests chart data
- **THEN** chart data for 1 January 2002 through 30 June 2002 is requested and the chart is redrawn

#### Scenario: Reversed range is not rejected

- **GIVEN** start date "12/31/2002" and end date "01/01/2002"
- **WHEN** the administrator requests chart data
- **THEN** no error is shown and chart data for that range is requested

### Requirement: Default chart date range

The sales charts SHALL open with a default date range of 1 January 2001 through 31 December 2002 until the administrator changes the dates.

#### Scenario: Charts open on the default range

- **GIVEN** the administration tool has just started
- **WHEN** the administrator opens the pie chart or the bar chart
- **THEN** the start date shows 01/01/2001 and the end date shows 12/31/2002

### Requirement: Per-item breakdown within a category

WHEN a revenue or sales-count request names a product category the system SHALL return the figures broken down per item of that category instead of per category; WHEN no category is named the figures SHALL be per category. The administration tool provides no way to name a category, so this breakdown MAY be unreachable from the shipped user interface.

#### Scenario: Category named in the request

- **GIVEN** orders in the range containing items EST-1 and EST-2 of category FISH and items of other categories
- **WHEN** a revenue request for the range names category FISH
- **THEN** the response lists revenue for EST-1 and EST-2 only, keyed by item

#### Scenario: No category named

- **GIVEN** the same orders
- **WHEN** a revenue request for the range names no category
- **THEN** the response lists revenue per category

### Requirement: Chart totals and invalid entries

The server SHALL compute the total revenue as the sum of the returned per-category (or per-item) revenue amounts and the total sales count as the integer sum of the returned counts. WHEN the administration tool receives chart data it MUST discard any entry that has no name or whose value is negative or unreadable, and it SHALL compute the totals used for the chart itself from the remaining entries.

#### Scenario: Unreadable entry is dropped

- **GIVEN** a chart response with entries DOGS 300.00, CATS "abc" and an unnamed entry 50.00
- **WHEN** the administration tool draws the revenue chart
- **THEN** only DOGS is charted and DOGS is shown as 100% of revenue

#### Scenario: Negative entry is dropped

- **GIVEN** a sales-count response with entries DOGS 4 and CATS -2
- **WHEN** the administration tool draws the bar chart
- **THEN** only the DOGS bar is drawn

### Requirement: Report data load on start and refresh

WHEN the administration tool starts, and WHEN the administrator chooses Refresh, the system SHALL reload all order lists and both sales charts from the server.

#### Scenario: Initial load

- **GIVEN** an administrator launches the administration tool
- **WHEN** its main window appears
- **THEN** the order lists, the revenue chart and the sales-count chart are populated without any further action

#### Scenario: Refresh reloads everything

- **GIVEN** a new order was approved after the tool was opened
- **WHEN** the administrator chooses Refresh
- **THEN** the order lists and both charts are reloaded and the newly approved order appears among the non-pending orders

### Requirement: Non-pending orders screen

The administration tool SHALL provide a "View Non-Pending Orders" screen listing every order whose status is APPROVED, COMPLETED (fulfilled) or DENIED. Each row MUST show the order ID, user ID, order date, amount and status; the list SHALL be sortable by clicking any column header; the list MUST be read-only, offering no control to change an order's status; and an order ID that is not numeric SHALL be displayed as -1. The list SHALL be loaded when the tool starts and reloaded by the Refresh action.

#### Scenario: Non-pending orders are displayed

- **GIVEN** orders with statuses APPROVED, COMPLETED, DENIED and PENDING
- **WHEN** the administrator opens the View Non-Pending Orders screen
- **THEN** every APPROVED, COMPLETED and DENIED order is listed with its ID, user ID, date, amount and status, and no PENDING order is listed

#### Scenario: Sorting by a column

- **GIVEN** the non-pending orders list is displayed
- **WHEN** the administrator clicks the Amount column header
- **THEN** the rows are re-ordered by amount

#### Scenario: Rows cannot be edited

- **GIVEN** the non-pending orders list is displayed
- **WHEN** the administrator tries to edit the status of a listed order
- **THEN** the value does not change and no status update is sent

#### Scenario: Non-numeric order ID

- **GIVEN** a non-pending order whose ID is not numeric
- **WHEN** the list is displayed
- **THEN** its ID column shows -1

### Requirement: Sales charts screen

The administration tool SHALL offer an Orders view (tabs "View Non-Pending Orders" and "Process Pending Orders") and a Sales view (tabs "Pie Chart" and "Bar Chart"), selectable from both the View menu and the toolbar, and it MUST open on the Orders view. Each chart tab SHALL show a description ("Showing total % of sales per category" for the pie chart, "Showing total # of sales per category" for the bar chart), a Start Date field, an End Date field and a "Get Data" button that requests the chart for the entered range.

#### Scenario: Switching to the Sales view

- **GIVEN** the administration tool has opened on the Orders view
- **WHEN** the administrator chooses Sales from the View menu or the toolbar
- **THEN** the Sales view is shown with the tabs "Pie Chart" and "Bar Chart"

#### Scenario: Chart tab controls

- **GIVEN** the Sales view is shown
- **WHEN** the administrator selects the "Bar Chart" tab
- **THEN** the tab shows "Showing total # of sales per category", a Start Date field, an End Date field and a "Get Data" button

#### Scenario: Get Data redraws the chart

- **GIVEN** the "Pie Chart" tab with valid start and end dates entered
- **WHEN** the administrator presses "Get Data"
- **THEN** the revenue chart is requested for that range and redrawn
