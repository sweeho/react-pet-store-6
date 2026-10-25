## ADDED Requirements

### Requirement: List all customers

ID: SWHR2-R-0068
Recovered from: CUST-REQ-0001
The system SHALL provide a way to list every customer on file.

#### Scenario: Customers exist

- **GIVEN** customers "j2ee" and "shopper" on file
- **WHEN** all customers are listed
- **THEN** both customers are returned

#### Scenario: No customers

- **GIVEN** no customers on file
- **WHEN** all customers are listed
- **THEN** an empty list is returned

### Requirement: Single editable seed data set

ID: SWHR2-R-0069
Recovered from: DATA-POPULATION-REQ-0001
The system SHALL seed its catalog, customer and inventory data from a bundled UTF-8 seed data set that includes localized catalog entries, SHALL create the datastore structures it needs when they are absent, and operators MAY edit the seed data set to change the initial catalog and inventory.

#### Scenario: First load into an empty datastore

- **GIVEN** a datastore in which no catalog, customer or inventory structures exist
- **WHEN** the seed data is loaded
- **THEN** the structures are created and the catalog, customer and inventory data from the seed data set are present

#### Scenario: Operator edits the seed data

- **GIVEN** an operator has added a product to the seed data set
- **WHEN** the seed data is loaded
- **THEN** the added product is present in the catalog

### Requirement: Contact information linked to an existing address

ID: SWHR2-R-0070
Recovered from: DATA-REQ-0001
WHEN a contact-information record is created from a given name, family name, telephone, e-mail and an already stored postal address, the system SHALL store the four values as supplied and SHALL link the existing address rather than copying it.

#### Scenario: Seeding a sample customer's contact details

- **GIVEN** a stored postal address
- **WHEN** a contact-information record is created with given name "ABC", family name "XYZ", a telephone, an e-mail and that address
- **THEN** the record holds the four values exactly as supplied and refers to the same stored address

### Requirement: Supplier seed inventory content

ID: SWHR2-R-0071
Recovered from: DPOP-BR-0001
The supplier seed data SHALL contain inventory for 29 items, EST-1 through EST-29, at a quantity of 10000 each; a seed entry without a quantity SHALL be seeded with quantity 0.

#### Scenario: Seeded supplier stock

- **GIVEN** an empty supplier inventory
- **WHEN** supplier seeding completes
- **THEN** 29 inventory records EST-1 to EST-29 exist, each with quantity 10000

#### Scenario: Seed entry without a quantity

- **GIVEN** a seed inventory entry that carries no quantity
- **WHEN** supplier seeding runs
- **THEN** that item is seeded with quantity 0

### Requirement: Storefront seed data content

ID: SWHR2-R-0072
Recovered from: POP-ENT-0004
The system SHALL seed four sign-on users (j2ee, j2ee-ja, shopper, j2ee-zh) each with a matching customer, five categories (Fish, Dogs, Reptiles, Cats, Birds), sixteen products and twenty-eight items, each item with English, Japanese and Chinese details and prices.

#### Scenario: Seeded storefront contents

- **GIVEN** an empty storefront datastore
- **WHEN** the sample load completes
- **THEN** exactly 4 sample users with 4 matching customers, 5 categories, 16 products and 28 items exist
- **AND** each item has details and a price in English, Japanese and Chinese

### Requirement: Sample account replacement by id

ID: SWHR2-R-0073
Recovered from: POP-RULE-0003
WHEN sample data is loaded, the system SHALL remove and recreate from the sample data every customer and user whose id matches a sample record, and SHALL leave customers and users with any other id in place.

#### Scenario: Sample account reset

- **GIVEN** sample user "j2ee" whose customer details have been edited, and a registered customer "alice"
- **WHEN** sample data is loaded
- **THEN** "j2ee" and its customer are restored from the sample data
- **AND** "alice" and its customer are unchanged

### Requirement: Separate datastores per application area

ID: SWHR2-R-0074
Recovered from: data-population-REQ-0001
The system SHALL keep three separate datastores, one each for the storefront, the supplier and order processing, each created empty at installation if it does not already exist.

#### Scenario: Fresh installation

- **GIVEN** a host with none of the three datastores
- **WHEN** the system is installed
- **THEN** the storefront, supplier and order-processing datastores each exist and hold no business data

#### Scenario: Installation over an existing datastore

- **GIVEN** a host on which the storefront datastore already exists
- **WHEN** the system is installed
- **THEN** the existing storefront datastore is kept and only the missing datastores are created

### Requirement: Installation sequence

ID: SWHR2-R-0075
Recovered from: data-population-WF-0001
The system SHALL be installed as four application areas (storefront, order processing, supplier and administration), the datastore structures of each area SHALL be generated before that area is made available, and the storefront SHALL be reachable at the "/petstore" path once installation completes.

#### Scenario: Installation completes

- **GIVEN** a host with the three datastores created
- **WHEN** installation completes
- **THEN** the storefront, order-processing, supplier and administration areas are all available
- **AND** the storefront answers at "/petstore"
