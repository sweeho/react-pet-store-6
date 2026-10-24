## ADDED Requirements

### Requirement: Process Pending Orders screen

The Process Pending Orders screen SHALL list only orders whose status is PENDING, one row per order showing its ID, User ID, Date, Amount and Status, and the list SHALL be sortable by column. The Status value SHALL be the only editable value in a row, and its choices MUST be exactly PENDING, APPROVED and DENIED. The screen SHALL offer an Approve control, a Deny control and a Commit control.

#### Scenario: Pending orders are displayed

- **GIVEN** three orders with status PENDING and two orders with status APPROVED
- **WHEN** the Process Pending Orders screen is displayed
- **THEN** exactly the three PENDING orders are listed, each showing ID, User ID, Date, Amount and Status, together with Approve, Deny and Commit controls

#### Scenario: Only the status can be edited

- **GIVEN** a pending order listed on the screen
- **WHEN** the administrator tries to edit its ID, User ID, Date or Amount
- **THEN** the value cannot be changed

#### Scenario: Status choices offered

- **GIVEN** a pending order listed on the screen
- **WHEN** the administrator edits its Status
- **THEN** the choices offered are PENDING, APPROVED and DENIED and no other value can be chosen

#### Scenario: Sorting by a column

- **GIVEN** several pending orders with different amounts
- **WHEN** the administrator sorts by the Amount column
- **THEN** the rows are reordered by amount

### Requirement: Pending order status colour coding

The Process Pending Orders screen SHALL colour each order's Status value by its current marking: APPROVED in green, DENIED in red and PENDING in yellow.

#### Scenario: Statuses are colour-coded

- **GIVEN** three pending orders, one left PENDING, one marked APPROVED and one marked DENIED but not yet committed
- **WHEN** the screen is displayed
- **THEN** the PENDING status is shown in yellow, the APPROVED status in green and the DENIED status in red

### Requirement: View Non-Pending Orders screen

The system SHALL provide a View Non-Pending Orders screen, separate from the Process Pending Orders screen, listing every order whose status is APPROVED, DENIED or COMPLETED, one row per order showing its ID, User ID, Date, Amount and Status. The list SHALL be sortable by column, SHALL NOT allow any value to be edited, and SHALL be reloaded when the administrator refreshes.

#### Scenario: Decided orders are displayed read-only

- **GIVEN** orders with statuses PENDING, APPROVED, DENIED and COMPLETED
- **WHEN** the View Non-Pending Orders screen is displayed
- **THEN** the APPROVED, DENIED and COMPLETED orders are listed with ID, User ID, Date, Amount and Status, the PENDING order is not listed, and no value can be edited

#### Scenario: Refresh shows newly decided orders

- **GIVEN** an order approved and committed since the screen was last loaded
- **WHEN** the administrator refreshes
- **THEN** the order appears on the View Non-Pending Orders screen with status APPROVED

### Requirement: Bulk marking of selected pending orders

The system SHALL let the administrator select several pending orders and mark all of them APPROVED, or all of them DENIED, in one action. A marking MUST remain local to the administrator's screen and SHALL NOT be sent until the administrator commits.

#### Scenario: Approve several selected orders

- **GIVEN** five pending orders of which three are selected
- **WHEN** the administrator activates Approve
- **THEN** the three selected orders show status APPROVED, the other two still show PENDING, and nothing is sent to the server

#### Scenario: Deny several selected orders

- **GIVEN** two pending orders that are both selected
- **WHEN** the administrator activates Deny
- **THEN** both orders show status DENIED and nothing is sent to the server

### Requirement: Committing approval decisions

WHEN the administrator commits, the system SHALL send every order marked APPROVED as one approval batch and then every order marked DENIED as one denial batch, SHALL NOT send orders still marked PENDING, and SHALL then reload the order lists so that decided orders leave the pending list. GIVEN no order is marked APPROVED or DENIED, a commit MUST send nothing.

#### Scenario: Commit approvals and denials

- **GIVEN** pending orders A and B marked APPROVED, order C marked DENIED and order D left PENDING
- **WHEN** the administrator commits
- **THEN** one batch containing A and B with status APPROVED is sent, then one batch containing C with status DENIED, D is not sent, and the order lists are reloaded

#### Scenario: Commit with nothing marked

- **GIVEN** every listed pending order is still marked PENDING
- **WHEN** the administrator commits
- **THEN** nothing is sent to the server

#### Scenario: Only approvals marked

- **GIVEN** order A marked APPROVED and no order marked DENIED
- **WHEN** the administrator commits
- **THEN** exactly one batch is sent, containing A with status APPROVED

### Requirement: Warning before discarding uncommitted decisions

GIVEN at least one pending order is marked with a status other than PENDING and has not been committed, WHEN the administrator asks to refresh, the system SHALL warn "Data is not committed. Are you sure you want to refresh?" and SHALL reload, discarding the uncommitted markings, only if the administrator confirms.

#### Scenario: Refresh cancelled

- **GIVEN** an order marked APPROVED and not committed
- **WHEN** the administrator asks to refresh and declines the warning
- **THEN** no reload happens and the order still shows APPROVED

#### Scenario: Refresh confirmed

- **GIVEN** an order marked DENIED and not committed
- **WHEN** the administrator asks to refresh and confirms the warning
- **THEN** the lists are reloaded and the order shows its stored status PENDING

#### Scenario: Refresh with nothing uncommitted

- **GIVEN** every pending order is still marked PENDING
- **WHEN** the administrator asks to refresh
- **THEN** the lists are reloaded without a warning

### Requirement: Loading order lists on start and refresh

WHEN the administration tool starts, and whenever the administrator refreshes, the system SHALL load the orders in each of the statuses PENDING, APPROVED, DENIED and COMPLETED.

#### Scenario: Tool start

- **GIVEN** orders exist in each of the four statuses
- **WHEN** the administration tool starts
- **THEN** the pending list and the non-pending list are populated without the administrator requesting a refresh

### Requirement: Busy state during server requests

WHILE a request to the server is in progress, the system SHALL disable the Approve, Deny, Commit, Refresh, About and Exit actions, SHALL show "Retrieving data from the server..." while loading or "Updating data on the server..." while sending decisions, and SHALL re-enable the actions once the reply has been applied.

#### Scenario: Commit in progress

- **GIVEN** the administrator has committed decisions
- **WHEN** the request is in progress
- **THEN** Approve, Deny, Commit, Refresh, About and Exit are disabled and "Updating data on the server..." is shown, and they are enabled again after the reply

#### Scenario: Load in progress

- **GIVEN** the administrator has asked to refresh
- **WHEN** the request is in progress
- **THEN** the actions are disabled and "Retrieving data from the server..." is shown

### Requirement: Server communication failure

WHEN a load or commit request to the server fails, the system SHALL show an error dialog titled "Fatal Error!" carrying the error message and SHALL then close the administration tool, discarding any uncommitted markings.

#### Scenario: Commit fails

- **GIVEN** the administrator has committed decisions
- **WHEN** the server request fails
- **THEN** a "Fatal Error!" dialog is shown and, once it is dismissed, the administration tool closes

### Requirement: Retrieve orders by status

The system SHALL let an administrator retrieve all orders whose status exactly matches a given status, returning the requested status, the number of matching orders and, for each order, its id, user id, date, amount and status. Each order MUST appear at most once, and the order of the results is unspecified.

#### Scenario: Pending orders requested

- **GIVEN** four orders, three PENDING and one APPROVED
- **WHEN** an administrator requests orders with status PENDING
- **THEN** the reply carries status PENDING, a count of 3 and the three PENDING orders, each once

#### Scenario: Status matched exactly

- **GIVEN** an order with status PENDING
- **WHEN** orders with status "pending" are requested
- **THEN** that order is not returned

### Requirement: Order as seen by the administrator

The system SHALL represent an order to the administrator by its order id, the customer's user id, the order date, the order amount and its status, where the status MUST be one of PENDING, APPROVED, DENIED or COMPLETED.

#### Scenario: Order fields

- **GIVEN** an order placed by user j2ee for 612.50 on 2026-10-01 and awaiting approval
- **WHEN** it is shown to the administrator
- **THEN** it carries its order id, user id j2ee, date 2026-10-01, amount 612.50 and status PENDING

### Requirement: Handling a submitted status update

WHEN the server receives a status update batch from the administrator, it SHALL build one approval decision batch listing each (order id, new status) pair, SHALL skip without error any entry that lacks an order id or a status, SHALL pass each status value on unchanged, and SHALL reply SUCCESS once the batch has been handed to order processing, not once the orders have changed. WHEN the hand-off fails, the server SHALL reply with an error asking the administrator to try again.

#### Scenario: Incomplete entry skipped

- **GIVEN** a status update with entries (1001, APPROVED), (1002, no status) and (1003, APPROVED)
- **WHEN** the server processes it
- **THEN** a batch containing 1001 and 1003 is handed to order processing and the reply is SUCCESS

#### Scenario: Hand-off fails

- **GIVEN** a valid status update
- **WHEN** handing the batch to order processing fails
- **THEN** the reply is an error asking the administrator to try again

### Requirement: Asynchronous delivery of approval decisions

The system SHALL deliver approval and denial decisions to order processing asynchronously, as a single message per batch on a dedicated, durable order-approval channel, so that the sender does not wait for order processing to act on the decisions.

#### Scenario: Administrator decisions delivered

- **GIVEN** an administrator commits an approval batch for orders 1001 and 1003
- **WHEN** the server hands it on
- **THEN** one message carrying both decisions is placed on the order-approval channel and the server replies before order processing has acted on it

### Requirement: Approval decision batch format

An approval decision batch SHALL contain one or more entries, each carrying an order identifier followed by the order's new status. A receiver MUST reject a batch whose root is not an approval decision batch, that contains no entry, or in which an entry's order identifier or status is missing, empty or out of order.

#### Scenario: Well-formed batch accepted

- **GIVEN** a batch with entries (1001, APPROVED) and (1002, DENIED)
- **WHEN** it is received
- **THEN** both decisions are read

#### Scenario: Entry with empty status rejected

- **GIVEN** a batch whose only entry has order identifier 1001 and an empty status
- **WHEN** it is received
- **THEN** the batch is rejected

#### Scenario: Batch with no entries rejected

- **GIVEN** a batch containing no order entry
- **WHEN** it is received
- **THEN** the batch is rejected

### Requirement: Batch format does not restrict status values

The approval decision batch format SHALL accept any non-empty text as an order's new status; the format itself MUST NOT restrict the status to a fixed set of values.

#### Scenario: Unlisted status carried

- **GIVEN** a batch entry with order identifier 1001 and status COMPLETED
- **WHEN** the batch is read
- **THEN** the entry is read with status COMPLETED and no format error is raised

### Requirement: Approval batch schema validation by default

The system SHALL validate an incoming approval decision batch against its declared schema by default, and SHALL skip that validation only when the receiver is explicitly configured to.

#### Scenario: Default validation

- **GIVEN** a receiver with no validation setting supplied
- **WHEN** an approval decision batch is read
- **THEN** it is validated against the declared schema

### Requirement: Automatic approval of small US orders

WHEN a new order is received it SHALL first be recorded as PENDING; GIVEN its locale is US English and its total is strictly less than 500, the system SHALL then approve it automatically without administrator review, and SHALL otherwise leave it pending for an administrator.

#### Scenario: US order below threshold

- **GIVEN** a US-locale order with total 499.99
- **WHEN** it is received
- **THEN** it is approved automatically

#### Scenario: US order at exactly the threshold

- **GIVEN** a US-locale order with total 500.00
- **WHEN** it is received
- **THEN** it remains PENDING for administrator review

#### Scenario: US order above threshold

- **GIVEN** a US-locale order with total 612.50
- **WHEN** it is received
- **THEN** it remains PENDING and appears on the Process Pending Orders screen

### Requirement: Automatic approval for other locales

GIVEN a new order's locale is Japanese and its total is strictly less than 50000, the system SHALL approve it automatically. An order in any locale other than US English or Japanese MUST NOT be approved automatically, whatever its total.

#### Scenario: Japanese order below threshold

- **GIVEN** a Japan-locale order with total 49999
- **WHEN** it is received
- **THEN** it is approved automatically

#### Scenario: Japanese order at the threshold

- **GIVEN** a Japan-locale order with total 50000
- **WHEN** it is received
- **THEN** it remains PENDING

#### Scenario: Chinese order of a small total

- **GIVEN** a zh_CN-locale order with total 10
- **WHEN** it is received
- **THEN** it remains PENDING for administrator review
