## MODIFIED Requirements

### Requirement: Pending and non-pending order views

ID: SWHR2-R-0087

The system SHALL present administrators with two separate views of orders: one view listing pending orders, and one view listing non-pending orders, meaning orders that have been approved, denied or completed. The non-pending view SHALL be loaded on request, and SHALL show each listed order with its status at the time of loading.

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

#### Scenario: Approved order fulfilled before the refresh
ID: SWHR2-R-0087.03

- **GIVEN** an order approved since the non-pending view was last loaded, which order processing has since completely fulfilled
- **WHEN** the administrator requests a refresh
- **THEN** the order appears in the non-pending view with status COMPLETED and no longer appears in the pending view
