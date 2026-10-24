## ADDED Requirements

### Requirement: Automatic sample-data population on store entry

The system SHALL populate the storefront datastore with the sample catalog, sign-on users and customers when a visitor enters the store and the store is not already populated, and SHALL leave existing data untouched when it is already populated.

#### Scenario: First entry into an empty store

- **GIVEN** a storefront datastore with no catalog rows, no customers and no users
- **WHEN** a visitor chooses to enter the store
- **THEN** the sample catalog, users and customers are loaded before the visitor reaches the storefront

#### Scenario: Entry into an already populated store

- **GIVEN** a storefront whose categories, products, items, customers and users are all non-empty
- **WHEN** a visitor chooses to enter the store
- **THEN** no data is dropped or reloaded

### Requirement: Populated-state check

The system SHALL treat the storefront as already populated only when the category, product and item data are each non-empty AND at least one customer exists AND at least one user exists; if any part of the check cannot be evaluated, the store SHALL be treated as not populated.

#### Scenario: Catalog present but no users

- **GIVEN** a storefront with catalog rows and customers but no users
- **WHEN** non-forced population runs
- **THEN** the store is treated as not populated and the full sample load runs

#### Scenario: Check fails with an error

- **GIVEN** a storefront where reading the customer list raises an error
- **WHEN** non-forced population runs
- **THEN** the store is treated as not populated and the full sample load runs

### Requirement: Forced repopulation

The system SHALL offer a forced repopulation that runs the full sample load regardless of the populated-state check.

#### Scenario: Forced repopulation of a populated store

- **GIVEN** a fully populated storefront
- **WHEN** forced repopulation is requested
- **THEN** the full sample load runs even though the populated-state check would pass

### Requirement: Catalog rebuild on every sample load

WHEN the full sample load runs, the system SHALL discard and recreate all catalog data (categories, products and items) and load the catalog from the seed data; a failure while discarding catalog data that does not exist SHALL NOT stop the load.

#### Scenario: Catalog edits are lost on reload

- **GIVEN** a populated storefront where an item's price was changed after seeding
- **WHEN** a forced repopulation runs
- **THEN** the item carries its seeded price again and no non-seed catalog rows remain

#### Scenario: First load with no catalog structures

- **GIVEN** a storefront datastore in which no catalog data has ever existed
- **WHEN** the full sample load runs
- **THEN** the catalog data is created and loaded without error

### Requirement: Sample account replacement by id

WHEN sample data is loaded, the system SHALL remove and recreate every user and customer whose id matches a sample record, and SHALL leave users and customers with any other id in place.

#### Scenario: Sample account reset

- **GIVEN** sample user "j2ee" whose customer details have been edited, and a registered customer "alice"
- **WHEN** the full sample load runs
- **THEN** "j2ee" and its customer are restored from the seed data
- **AND** "alice" and its customer are unchanged

### Requirement: Storefront seed data content

The storefront seed data SHALL contain four sign-on users (j2ee, j2ee-ja, shopper, j2ee-zh) each with a matching customer, and a catalog of five categories (FISH, DOGS, REPTILES, CATS, BIRDS), sixteen products and twenty-eight items, with each catalog entry carrying English, Japanese and Chinese details and prices.

#### Scenario: Seeded storefront contents

- **GIVEN** an empty storefront datastore
- **WHEN** the sample load completes
- **THEN** exactly 4 sample users with 4 matching customers, 5 categories, 16 products and 28 items exist
- **AND** each category, product and item has details in English, Japanese and Chinese

### Requirement: Single editable seed data set

The system SHALL take its initial catalog, customer and inventory data from a bundled UTF-8 seed data set that operators MAY edit to change the initial data, and SHALL create the datastore structures it needs when they are absent.

#### Scenario: Operator edits the seed data

- **GIVEN** an operator has added a product to the seed data set
- **WHEN** a forced repopulation runs
- **THEN** the added product is present in the catalog

### Requirement: Session ended on population

WHEN population runs, the system SHALL end the requesting visitor's session before loading any data, whether or not a load is actually performed.

#### Scenario: Signed-in visitor triggers population

- **GIVEN** a visitor signed in as "j2ee" with items in the cart
- **WHEN** the visitor triggers population
- **THEN** the visitor is signed out and the session state is discarded

### Requirement: Chained supplier population

WHEN storefront population succeeds, the system SHALL go on to run supplier inventory population with the same forced or non-forced choice, and SHALL then return the visitor to the storefront main page.

#### Scenario: Non-forced entry chain

- **GIVEN** a visitor choosing to enter the store
- **WHEN** storefront population completes
- **THEN** supplier population runs in non-forced mode
- **AND** the visitor lands on the storefront main page

#### Scenario: Forced chain

- **GIVEN** a visitor choosing forced repopulation
- **WHEN** storefront population completes
- **THEN** supplier population runs in forced mode

### Requirement: Supplier inventory seeding gate

The system SHALL load supplier inventory from the supplier seed data only when no inventory records exist, unless a forced population is requested, in which case it SHALL load the seed data regardless; each seeded item SHALL replace any existing inventory record with the same item id.

#### Scenario: Inventory already present, not forced

- **GIVEN** a supplier with at least one inventory record
- **WHEN** non-forced supplier population runs
- **THEN** no inventory record is changed

#### Scenario: Forced reset of inventory

- **GIVEN** supplier item EST-1 with quantity 37
- **WHEN** forced supplier population runs
- **THEN** EST-1 has quantity 10000

### Requirement: Supplier seed inventory content

The supplier seed data SHALL contain inventory for items EST-1 through EST-29 with a quantity of 10000 each; a seed entry whose quantity is missing or not numeric SHALL be seeded with quantity 0.

#### Scenario: Seeded supplier stock

- **GIVEN** an empty supplier inventory
- **WHEN** supplier population completes
- **THEN** 29 inventory records EST-1 to EST-29 exist, each with quantity 10000

#### Scenario: Seed entry with a bad quantity

- **GIVEN** a seed inventory entry whose quantity is "abc"
- **WHEN** supplier population runs
- **THEN** that item is seeded with quantity 0

### Requirement: Post-population redirect and failure handling

WHEN population completes, the system SHALL send the caller to the requested success destination or, if none was given, back to the referring page; WHEN population fails, the system SHALL send the caller to the requested error destination or, if none was given, report the failure as a server error.

#### Scenario: Success with a destination

- **GIVEN** a population request naming a success destination
- **WHEN** population completes
- **THEN** the caller is sent to that destination

#### Scenario: Success without a destination

- **GIVEN** a population request with no success destination and a referring page
- **WHEN** population completes
- **THEN** the caller is sent back to the referring page

#### Scenario: Failure without an error destination

- **GIVEN** a population request with no error destination
- **WHEN** loading the seed data fails
- **THEN** the caller receives a server error response

### Requirement: Population progress notice

WHILE population is being started, the system SHALL show the caller a please-wait notice and SHALL begin population immediately, without further input, carrying through the forced or non-forced choice.

#### Scenario: Visitor enters the store

- **GIVEN** a visitor on the start page
- **WHEN** the visitor chooses to enter the store
- **THEN** a please-wait notice is shown and population starts automatically in non-forced mode

### Requirement: Population access without sign-on

The system SHALL allow any visitor, without signing on, to trigger population and forced repopulation of the storefront and of the supplier inventory.

#### Scenario: Anonymous forced repopulation

- **GIVEN** a visitor who has not signed on
- **WHEN** the visitor requests forced repopulation
- **THEN** the storefront catalog is rebuilt, the sample accounts are reset and supplier inventory is reset to its seed quantities

### Requirement: List all customers

The system SHALL provide a way to list every customer on file.

#### Scenario: Customers exist

- **GIVEN** customers "j2ee" and "shopper" on file
- **WHEN** all customers are listed
- **THEN** both customers are returned

#### Scenario: No customers

- **GIVEN** no customers on file
- **WHEN** all customers are listed
- **THEN** an empty list is returned

### Requirement: Contact information linked to an existing address

WHEN a contact-information record is created from a given name, family name, telephone, e-mail and an already stored postal address, the system SHALL store the four values as supplied and SHALL link the existing address rather than copying it.

#### Scenario: Seeding a sample customer's contact details

- **GIVEN** a stored postal address
- **WHEN** a contact-information record is created with given name "ABC", family name "XYZ", a telephone, an e-mail and that address
- **THEN** the record holds the four values exactly as supplied and refers to the same stored address

### Requirement: Separate datastores per application area

The system SHALL keep storefront data, supplier data and order-processing data in three separate datastores, each created automatically if it does not yet exist.

#### Scenario: Fresh installation

- **GIVEN** a host with none of the three datastores
- **WHEN** the system is installed
- **THEN** the storefront, supplier and order-processing datastores each exist and are empty of business data

### Requirement: Installation sequence

The system SHALL be installed as four application areas (storefront, order processing, supplier and administration), creating each area's datastore structures before that area is made available, and the storefront SHALL be reachable at the "/petstore" path once installation completes.

#### Scenario: Installation completes

- **GIVEN** a host with the three datastores created
- **WHEN** installation completes
- **THEN** the storefront, order-processing, supplier and administration areas are all available
- **AND** the storefront answers at "/petstore"
