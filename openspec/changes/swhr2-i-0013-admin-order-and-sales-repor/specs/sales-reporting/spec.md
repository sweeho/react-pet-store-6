## ADDED Requirements

### Requirement: Orders by current status

ID: SWHR2-R-0143
Recovered from: SALES-REQ-0001
The system SHALL list, for the administrator, every order whose current status exactly equals a given status, and each order MUST appear at most once in the result. No ordering or paging SHALL be applied.

#### Scenario: Orders at the requested status are listed once each
ID: SWHR2-R-0143.01

- **GIVEN** three orders currently PENDING and two currently APPROVED
- **WHEN** the administrator requests orders with status PENDING
- **THEN** exactly the three PENDING orders are returned, each once

#### Scenario: Status match is exact
ID: SWHR2-R-0143.02

- **GIVEN** orders whose status is APPROVED
- **WHEN** orders with status "approved" (different case) are requested
- **THEN** no orders are returned

### Requirement: Order list details by status

ID: SWHR2-R-0113
Recovered from: SREP-REQ-0001
The system SHALL provide administrators with the list of orders in a requested status, and for each order it MUST give the order id, the customer's user id, the order date as M/D/YYYY, the order value and the status.

#### Scenario: Details of each order in the status
ID: SWHR2-R-0113.01

- **GIVEN** an order with id 1001 for user j2ee, placed on 5 March 2002, valued 120.50 and currently APPROVED
- **WHEN** the administrator requests the orders with status APPROVED
- **THEN** the list contains that order with id 1001, user id j2ee, order date 3/5/2002, value 120.50 and status APPROVED

#### Scenario: No orders in the status
ID: SWHR2-R-0113.02

- **GIVEN** no order is currently DENIED
- **WHEN** the administrator requests the orders with status DENIED
- **THEN** an empty list is returned

### Requirement: Default chart date range

ID: SWHR2-R-0026
Recovered from: SALES-BR-0007
The system SHALL default the chart date range to 1 January 2001 through 31 December 2002 until the administrator changes the dates.

#### Scenario: Charts open on the default range
ID: SWHR2-R-0026.01

- **GIVEN** the administration tool has just started
- **WHEN** the administrator opens the pie chart or the bar chart
- **THEN** the start date shows 01/01/2001 and the end date shows 12/31/2002

### Requirement: Per-item breakdown within a category

ID: SWHR2-R-0025
Recovered from: SALES-BR-0008
WHEN a revenue or sales-count request names a product category the system SHALL return the figures broken down per item of that category instead of per category; WHEN no category is named the figures SHALL be per category. The administration tool provides no way to name a category, so this breakdown MAY be unreachable from the shipped user interface.

#### Scenario: Category named in the request
ID: SWHR2-R-0025.01

- **GIVEN** orders in the range containing items EST-1 and EST-2 of category FISH and items of other categories
- **WHEN** a revenue request for the range names category FISH
- **THEN** the response lists revenue for EST-1 and EST-2 only, keyed by item

#### Scenario: No category named
ID: SWHR2-R-0025.02

- **GIVEN** the same orders
- **WHEN** a revenue request for the range names no category
- **THEN** the response lists revenue per category

### Requirement: Report data load on start and refresh

ID: SWHR2-R-0112
Recovered from: SALES-WF-0010
WHEN the administration tool starts, and WHEN the administrator chooses Refresh, the system SHALL reload all order lists and both sales charts from the server. The system SHALL let the administrator switch between an Orders view (non-pending and pending order tabs) and a Sales view (pie chart and bar chart tabs), and it MUST open on the Orders view.

#### Scenario: Initial load
ID: SWHR2-R-0112.01

- **GIVEN** an administrator launches the administration tool
- **WHEN** its main window appears
- **THEN** the Orders view is shown and the order lists, the revenue chart and the sales-count chart are populated without any further action

#### Scenario: Refresh reloads everything
ID: SWHR2-R-0112.02

- **GIVEN** a new order was approved after the tool was opened
- **WHEN** the administrator chooses Refresh
- **THEN** the order lists and both charts are reloaded and the newly approved order appears among the non-pending orders

#### Scenario: Switching to the Sales view
ID: SWHR2-R-0112.03

- **GIVEN** the administration tool is showing the Orders view
- **WHEN** the administrator switches to the Sales view
- **THEN** the pie chart and bar chart tabs are shown

### Requirement: Non-pending orders screen

ID: SWHR2-R-0110
Recovered from: SALES-REPORTING-SCREEN-0001
The administration tool SHALL provide a View Non-Pending Orders screen listing every order whose status is approved, denied or completed (fulfilled), and it MUST NOT list pending orders. The list SHALL be loaded by the Refresh action.

#### Scenario: Only non-pending orders are listed
ID: SWHR2-R-0110.01

- **GIVEN** orders with statuses APPROVED, DENIED, COMPLETED and PENDING
- **WHEN** the administrator opens the View Non-Pending Orders screen after a refresh
- **THEN** every APPROVED, DENIED and COMPLETED order is listed and no PENDING order is listed

#### Scenario: Refresh loads newly decided orders
ID: SWHR2-R-0110.02

- **GIVEN** the View Non-Pending Orders screen is open and an order has since been denied
- **WHEN** the administrator chooses Refresh
- **THEN** the denied order appears in the list

### Requirement: Order list columns and sorting

ID: SWHR2-R-0111
Recovered from: SALES-SCR-0002
Both order lists (pending and non-pending) SHALL show, for each order, its ID, user ID, order date, amount and status, and SHALL let the administrator sort the list by clicking any column header. WHEN an order ID is not numeric the list MUST display it as -1.

#### Scenario: Order rows show five columns
ID: SWHR2-R-0111.01

- **GIVEN** an order list containing an order with ID 1001, user ID j2ee, date 3/5/2002, amount 120.50 and status APPROVED
- **WHEN** the list is displayed
- **THEN** the row shows 1001, j2ee, 3/5/2002, 120.50 and APPROVED in the ID, User ID, Date, Amount and Status columns

#### Scenario: Sorting by a column
ID: SWHR2-R-0111.02

- **GIVEN** an order list is displayed
- **WHEN** the administrator clicks the Amount column header
- **THEN** the rows are re-ordered by amount

#### Scenario: Non-numeric order ID
ID: SWHR2-R-0111.03

- **GIVEN** an order whose ID is not numeric
- **WHEN** the list is displayed
- **THEN** its ID column shows -1
