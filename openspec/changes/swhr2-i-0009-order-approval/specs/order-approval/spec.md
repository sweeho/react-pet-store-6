## ADDED Requirements

### Requirement: Pending and non-pending order views

ID: SWHR2-R-0087
Recovered from: ORDER-APPROVAL-SCR-0004
The system SHALL present administrators with two separate views of orders: one view listing pending orders, and one view listing non-pending orders, meaning orders that have been approved, denied or completed. The non-pending view SHALL be loaded on request.

#### Scenario: Orders are split between the two views
ID: SWHR2-R-0087.01

- **GIVEN** orders with statuses PENDING, APPROVED, DENIED and COMPLETED
- **WHEN** the administrator opens the order views
- **THEN** the PENDING order appears only in the pending view, and the APPROVED, DENIED and COMPLETED orders appear only in the non-pending view

#### Scenario: Non-pending view reloaded on request
ID: SWHR2-R-0087.02

- **GIVEN** an order approved since the non-pending view was last loaded
- **WHEN** the administrator requests a refresh
- **THEN** the order appears in the non-pending view with status APPROVED

### Requirement: Pending order status colour coding

ID: SWHR2-R-0084
Recovered from: OAPP-SCR-0009
The system SHALL colour each order's status in the pending-orders list: APPROVED in green, DENIED in red and PENDING in yellow.

#### Scenario: Statuses are colour-coded
ID: SWHR2-R-0084.01

- **GIVEN** three orders in the pending-orders list, one left PENDING, one marked APPROVED and one marked DENIED
- **WHEN** the list is displayed
- **THEN** the PENDING status is shown in yellow, the APPROVED status in green and the DENIED status in red

### Requirement: Batch approval and denial committed together

ID: SWHR2-R-0088
Recovered from: ORDER-APPROVAL-WF-0003
The system SHALL let an administrator select one or more pending orders and set each to approved or denied, and SHALL apply all of those status changes together only when the administrator commits them.

#### Scenario: Decisions held until commit
ID: SWHR2-R-0088.01

- **GIVEN** three pending orders, of which the administrator marks two approved and one denied
- **WHEN** the administrator has not yet committed
- **THEN** none of the three orders' stored status has changed

#### Scenario: Decisions applied on commit
ID: SWHR2-R-0088.02

- **GIVEN** two pending orders marked approved and one marked denied
- **WHEN** the administrator commits
- **THEN** all three status changes are submitted together

### Requirement: Warning before discarding uncommitted decisions

ID: SWHR2-R-0135
Recovered from: OAPP-BR-0005
GIVEN at least one pending order has been marked with a status other than PENDING and not committed, WHEN the administrator asks to refresh the data, the system SHALL warn "Data is not committed. Are you sure you want to refresh?" and SHALL refresh, discarding the uncommitted marks, only if the administrator confirms.

#### Scenario: Refresh cancelled
ID: SWHR2-R-0135.01

- **GIVEN** an order marked APPROVED and not committed
- **WHEN** the administrator asks to refresh and declines the warning
- **THEN** no refresh happens and the order still shows APPROVED

#### Scenario: Refresh confirmed
ID: SWHR2-R-0135.02

- **GIVEN** an order marked DENIED and not committed
- **WHEN** the administrator asks to refresh and confirms the warning
- **THEN** the data is reloaded and the order shows its stored status PENDING

#### Scenario: Refresh with nothing uncommitted
ID: SWHR2-R-0135.03

- **GIVEN** every pending order is still marked PENDING
- **WHEN** the administrator asks to refresh
- **THEN** the data is reloaded without a warning

### Requirement: Loading order data on start and refresh

ID: SWHR2-R-0086
Recovered from: ORDA-BR-0007
WHEN the administration tool starts, and whenever the administrator refreshes, the system SHALL load the orders in each of the statuses PENDING, APPROVED, DENIED and COMPLETED, together with the revenue and order-count chart data for the current date ranges.

#### Scenario: Tool start
ID: SWHR2-R-0086.01

- **GIVEN** orders exist in each of the four statuses
- **WHEN** the administration tool starts
- **THEN** the orders in all four statuses and the revenue and order-count chart data are loaded without the administrator requesting a refresh

#### Scenario: Refresh
ID: SWHR2-R-0086.02

- **GIVEN** the administration tool is open
- **WHEN** the administrator refreshes
- **THEN** the orders in all four statuses and the chart data for the current date ranges are loaded again

### Requirement: Busy state during server requests

ID: SWHR2-R-0083
Recovered from: OAPP-BR-0007
WHILE a request to the server is in progress, the system SHALL disable the approve, deny, commit, chart-submit, refresh, about and exit actions and SHALL show a status message ("Retrieving data from the server..." or "Updating data on the server..."), and SHALL re-enable those actions when the reply has been applied.

#### Scenario: Update in progress
ID: SWHR2-R-0083.01

- **GIVEN** the administrator has committed decisions
- **WHEN** the request to the server is in progress
- **THEN** the approve, deny, commit, chart-submit, refresh, about and exit actions are disabled and "Updating data on the server..." is shown

#### Scenario: Retrieval in progress
ID: SWHR2-R-0083.02

- **GIVEN** the administrator has asked to refresh
- **WHEN** the request to the server is in progress
- **THEN** the actions are disabled and "Retrieving data from the server..." is shown

#### Scenario: Reply applied
ID: SWHR2-R-0083.03

- **GIVEN** a request to the server was in progress
- **WHEN** its reply has been applied
- **THEN** the actions are enabled again

### Requirement: New orders start pending

ID: SWHR2-R-0085
Recovered from: OAPP-WF-0002
WHEN an order is received from the storefront, the system SHALL persist the order and start its fulfilment workflow in status PENDING before any approval decision is taken.

#### Scenario: Order recorded before the approval decision
ID: SWHR2-R-0085.01

- **GIVEN** a new order arrives from the storefront
- **WHEN** it is received
- **THEN** the order is stored and its workflow status is PENDING before the system decides whether it is approved

### Requirement: Automatic approval thresholds by locale

ID: SWHR2-R-0022
Recovered from: OAPP-RULE-0001
The system SHALL automatically approve a newly received order WHEN the order locale is en_US AND the order total is strictly less than 500, OR WHEN the order locale is ja_JP AND the order total is strictly less than 50000. Every other order, in any other locale including zh_CN or with a total at or above the threshold, SHALL remain PENDING until an administrator approves or denies it.

#### Scenario: Japanese order below threshold
ID: SWHR2-R-0022.01

- **GIVEN** a ja_JP order with total 49999
- **WHEN** it is received
- **THEN** it is approved automatically

#### Scenario: Japanese order at the threshold
ID: SWHR2-R-0022.02

- **GIVEN** a ja_JP order with total 50000
- **WHEN** it is received
- **THEN** it remains PENDING until an administrator decides it

#### Scenario: Chinese order of a small total
ID: SWHR2-R-0022.03

- **GIVEN** a zh_CN order with total 10
- **WHEN** it is received
- **THEN** it remains PENDING until an administrator decides it

### Requirement: Automatic approval of small US orders

ID: SWHR2-R-0021
Recovered from: ORDER-APPROVAL-BR-0001
The system SHALL automatically approve a newly received US-locale order whose total price is strictly less than 500 (US dollars) without administrator review, and SHALL leave every other US-locale order pending for administrator review.

#### Scenario: US order below threshold
ID: SWHR2-R-0021.01

- **GIVEN** a US-locale order with total 499.99
- **WHEN** it is received
- **THEN** it is approved automatically

#### Scenario: US order at exactly the threshold
ID: SWHR2-R-0021.02

- **GIVEN** a US-locale order with total exactly 500.00
- **WHEN** it is received
- **THEN** it is not approved automatically and remains pending

#### Scenario: US order above threshold
ID: SWHR2-R-0021.03

- **GIVEN** a US-locale order with total 612.50
- **WHEN** it is received
- **THEN** it remains pending for administrator review

### Requirement: Asynchronous delivery of administrator decisions

ID: SWHR2-R-0136
Recovered from: ORDER-APPROVAL-INTEGRATION-0001
The system SHALL deliver an administrator's order approval or denial decisions to order processing asynchronously, by placing the decision document, as a single text message, on the order approval queue.

#### Scenario: Decisions delivered as one message
ID: SWHR2-R-0136.01

- **GIVEN** an administrator commits approvals for orders 1001 and 1003
- **WHEN** the decisions are handed to order processing
- **THEN** one message carrying both decisions is placed on the order approval queue and the administrator does not wait for order processing to act on it

### Requirement: Durable order approval channel

ID: SWHR2-R-0089
Recovered from: order-approval-INT-0001
The system SHALL provide an asynchronous, durable channel that carries order approval decisions into order processing.

#### Scenario: Decision survives until consumed
ID: SWHR2-R-0089.01

- **GIVEN** an approval decision has been placed on the order approval channel
- **WHEN** order processing has not yet consumed it
- **THEN** the decision remains on the channel until order processing receives it

### Requirement: Approval batch status is free text

ID: SWHR2-R-0082
Recovered from: OA-BR-0001
The system SHALL accept any text as an order's new status in an approval batch; the document format itself SHALL NOT restrict the status to a fixed set of values.

#### Scenario: Unlisted status carried
ID: SWHR2-R-0082.01

- **GIVEN** an approval batch entry with order identifier 1001 and status COMPLETED
- **WHEN** the batch is read
- **THEN** the entry is read with status COMPLETED and no format error is raised
