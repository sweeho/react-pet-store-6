## ADDED Requirements

### Requirement: Supplier stock record per item

The system SHALL keep exactly one supplier stock record per catalog item, identified uniquely by the item identifier, and each record MUST hold a mandatory whole-number quantity on hand.

#### Scenario: One stock record per item

- **GIVEN** a stock record already exists for item EST-1
- **WHEN** a second stock record for item EST-1 is created
- **THEN** the creation is refused and the existing record is unchanged

#### Scenario: Quantity is mandatory

- **GIVEN** a new stock record for item EST-2
- **WHEN** it is saved without a quantity
- **THEN** the save is refused

### Requirement: Inventory update replaces the stock quantity

WHEN the supplier submits an inventory update, the system SHALL, for each item that is marked for update and whose new-quantity entry is non-empty and is a whole number of zero or more, replace that item's stock quantity with the entered value. The update MUST NOT add the entered value to the existing quantity.

#### Scenario: Marked item with a valid quantity is overwritten

- **GIVEN** item EST-1 has 40 units in stock
- **WHEN** the supplier enters 25 for EST-1, marks it for update and submits
- **THEN** the stock quantity of EST-1 is 25, not 65

#### Scenario: Zero is accepted

- **GIVEN** item EST-1 has 40 units in stock
- **WHEN** the supplier enters 0 for EST-1, marks it for update and submits
- **THEN** the stock quantity of EST-1 is 0

### Requirement: Inventory update ignores unmarked, blank and negative entries

WHEN the supplier submits an inventory update, the system SHALL leave unchanged, without any message, every item that is not marked for update, every marked item whose new-quantity entry is empty, and every marked item whose entered quantity is negative.

#### Scenario: Edited but unmarked row is not applied

- **GIVEN** item EST-1 has 40 units in stock
- **WHEN** the supplier enters 10 for EST-1, leaves it unmarked and submits
- **THEN** the stock quantity of EST-1 remains 40

#### Scenario: Marked row with an empty quantity is not applied

- **GIVEN** item EST-1 has 40 units in stock
- **WHEN** the supplier marks EST-1 for update with an empty new quantity and submits
- **THEN** the stock quantity of EST-1 remains 40

#### Scenario: Negative quantity is not applied

- **GIVEN** item EST-1 has 40 units in stock
- **WHEN** the supplier enters -5 for EST-1, marks it for update and submits
- **THEN** the stock quantity of EST-1 remains 40 and no error message is shown

### Requirement: Stock is reduced when an order line ships

WHEN an order line is fulfilled, the system SHALL reduce the item's stock by the full ordered quantity of that line, in the same unit of work that records the line as shipped. GIVEN the stock on hand is less than the line's ordered quantity, the system MUST NOT reduce stock for that line at all.

#### Scenario: Sufficient stock

- **GIVEN** item EST-1 has 10 units in stock and an order line requests 4 units of EST-1
- **WHEN** fulfilment of the line is attempted
- **THEN** the line is shipped and the stock of EST-1 becomes 6

#### Scenario: Exactly enough stock

- **GIVEN** item EST-1 has 4 units in stock and an order line requests 4 units of EST-1
- **WHEN** fulfilment of the line is attempted
- **THEN** the line is shipped and the stock of EST-1 becomes 0

#### Scenario: Insufficient stock

- **GIVEN** item EST-1 has 3 units in stock and an order line requests 4 units of EST-1
- **WHEN** fulfilment of the line is attempted
- **THEN** the stock of EST-1 remains 3 and the line is not shipped

### Requirement: Inventory update re-fulfils pending orders in one unit of work

WHEN the supplier submits an inventory update, the system SHALL, as one unit of work, apply the stock changes, re-attempt fulfilment of every pending supplier order against the updated stock, and send an invoice for each order that shipped at least one line in that attempt.

#### Scenario: Restock releases a waiting order

- **GIVEN** a pending supplier order with one line of 5 units of EST-1, and EST-1 has 0 units in stock
- **WHEN** the supplier sets the stock of EST-1 to 8 and submits
- **THEN** the line ships, the stock of EST-1 becomes 3, and one invoice is sent for that order

#### Scenario: Restock that releases nothing

- **GIVEN** a pending supplier order with one line of 5 units of EST-1
- **WHEN** the supplier sets the stock of EST-1 to 2 and submits
- **THEN** the stock of EST-1 is 2, the order stays pending, and no invoice is sent for it

### Requirement: Inventory update confirmation

The system SHALL show the confirmation "Inventory was updated successfully" only after the inventory update unit of work has completed, and the confirmation MUST offer an action to display the inventory again and an action to log out.

#### Scenario: Successful update

- **GIVEN** the supplier has submitted an inventory update
- **WHEN** the stock changes, pending-order re-fulfilment and invoice sending complete
- **THEN** the confirmation "Inventory was updated successfully" is shown with a Display Inventory action and a Logout action

#### Scenario: Display inventory from the confirmation

- **GIVEN** the inventory update confirmation is shown
- **WHEN** the supplier chooses Display Inventory
- **THEN** the supplier inventory screen is shown with the updated quantities

### Requirement: Supplier home screen

The supplier home screen SHALL explain that it is used to update inventory so that back-ordered items can be filled, and MUST offer a Display Inventory action and a Logout action. A plain request to the supplier area SHALL land on this screen.

#### Scenario: Supplier opens the supplier area

- **GIVEN** a signed-in user in the administrator role
- **WHEN** the user opens the supplier area
- **THEN** the home screen is shown with the explanation, a Display Inventory action and a Logout action

#### Scenario: Display Inventory from home

- **GIVEN** the supplier home screen is shown
- **WHEN** the supplier chooses Display Inventory
- **THEN** the supplier inventory screen is shown

#### Scenario: Logout from home

- **GIVEN** the supplier home screen is shown
- **WHEN** the supplier chooses Logout
- **THEN** the supplier is signed out

### Requirement: Supplier inventory screen display

The supplier inventory screen SHALL list every stock record, one row per item, showing the item identifier and the existing quantity, and each row MUST offer a new-quantity entry field and an update marker. The list SHALL be shown only to a user in the administrator role; any other user SHALL see a not-authorised message instead of the list. WHEN the inventory cannot be read, the screen SHALL show "There are no items in inventory at all" instead of the list.

#### Scenario: Administrator views the inventory

- **GIVEN** an administrator and three stock records EST-1 (40), EST-2 (0) and EST-3 (12)
- **WHEN** the inventory screen is shown
- **THEN** three rows are listed, each with its item identifier, existing quantity, an empty new-quantity field and an unmarked update marker, and a single Submit control is offered

#### Scenario: User without the administrator role

- **GIVEN** a signed-in user who is not in the administrator role
- **WHEN** the inventory screen is requested
- **THEN** a not-authorised message is shown and no inventory list or Submit control is shown

#### Scenario: Inventory cannot be read

- **GIVEN** an administrator and the inventory store is unavailable
- **WHEN** the inventory screen is shown
- **THEN** the message "There are no items in inventory at all" is shown instead of the list

### Requirement: Supplier inventory screen batch submission

The supplier inventory screen SHALL let the supplier enter new quantities and mark items on as many rows as needed, and SHALL submit all marked changes together in one submission from a single Submit control.

#### Scenario: Several rows changed in one submission

- **GIVEN** the inventory screen listing EST-1 (40), EST-2 (0) and EST-3 (12)
- **WHEN** the supplier enters 50 for EST-1 and 20 for EST-2, marks both, and chooses Submit once
- **THEN** both changes are saved together, EST-1 is 50, EST-2 is 20 and EST-3 is 12

### Requirement: Supplier inventory screen update marking

On the supplier inventory screen, only rows the supplier has explicitly marked for update SHALL be submitted as changes; a new quantity typed into an unmarked row MUST NOT be saved.

#### Scenario: Mixed marked and unmarked rows

- **GIVEN** the inventory screen listing EST-1 (40) and EST-2 (0)
- **WHEN** the supplier enters 30 for EST-1 and marks it, enters 15 for EST-2 without marking it, and chooses Submit
- **THEN** EST-1 is 30 and EST-2 remains 0
