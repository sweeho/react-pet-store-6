## ADDED Requirements

### Requirement: Supplier stock record per item

ID: SWHR2-R-0149
Recovered from: SINV-ENT-0001
The system SHALL keep exactly one supplier stock record per catalog item, identified uniquely by the item identifier, and each record MUST hold a mandatory whole-number quantity on hand.

#### Scenario: One stock record per item
ID: SWHR2-R-0149.01

- **GIVEN** a stock record already exists for item EST-1
- **WHEN** a second stock record for item EST-1 is created
- **THEN** the creation is refused and the existing record is unchanged

#### Scenario: Quantity is mandatory
ID: SWHR2-R-0149.02

- **GIVEN** a new stock record for item EST-2
- **WHEN** it is saved without a quantity
- **THEN** the save is refused

### Requirement: Supplier inventory screen display and update marking

ID: SWHR2-R-0125
Recovered from: SUPPLIER-INVENTORY-SCR-0001
The supplier inventory screen SHALL list the quantity of each item in the inventory, one row per item, and each row MUST offer a new-quantity entry and an update marker. Only rows the supplier has explicitly marked for update SHALL be submitted as changes; a new quantity entered on an unmarked row MUST NOT be saved.

#### Scenario: Inventory is listed
ID: SWHR2-R-0125.01

- **GIVEN** stock records EST-1 (40), EST-2 (0) and EST-3 (12)
- **WHEN** the supplier chooses Display Inventory on the supplier home screen
- **THEN** three rows are listed, each showing the item and its existing quantity, an empty new-quantity entry and an unmarked update marker

#### Scenario: Mixed marked and unmarked rows
ID: SWHR2-R-0125.02

- **GIVEN** the inventory screen listing EST-1 (40) and EST-2 (0)
- **WHEN** the supplier enters 30 for EST-1 and marks it, enters 15 for EST-2 without marking it, and submits
- **THEN** EST-1 is 30 and EST-2 remains 0

### Requirement: Supplier inventory screen batch submission

ID: SWHR2-R-0126
Recovered from: SUPPLIER-INVENTORY-SCREEN-0001
The supplier inventory screen SHALL let the supplier enter new quantities and mark items on as many rows as needed, and SHALL save all marked changes together in one submission from a single Submit control.

#### Scenario: Several rows changed in one submission
ID: SWHR2-R-0126.01

- **GIVEN** the inventory screen listing EST-1 (40), EST-2 (0) and EST-3 (12)
- **WHEN** the supplier enters 50 for EST-1 and 20 for EST-2, marks both, and chooses Submit once
- **THEN** both changes are saved together, EST-1 is 50, EST-2 is 20 and EST-3 is 12
