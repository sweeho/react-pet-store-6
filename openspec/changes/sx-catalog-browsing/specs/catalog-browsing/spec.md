## ADDED Requirements

### Requirement: Catalog keyword search

ID: SWHR2-R-0001
Recovered from: CAT-BR-0002
The system SHALL search items in the requested locale by splitting the search text on whitespace into distinct keywords and SHALL return every item for which any keyword occurs as a substring of the product name, the category id, or the item description, matching case-insensitively. When the search text contains no keywords the system SHALL return an empty result without searching.

#### Scenario: Any keyword matches

- **GIVEN** an en_US item whose product name is "Angelfish" and an en_US item whose description mentions "koi"
- **WHEN** a search for "angel koi" is run in en_US
- **THEN** both items are returned

#### Scenario: Category id matches

- **GIVEN** an item whose product belongs to category "FISH"
- **WHEN** a search for "fish" is run
- **THEN** the item is returned even if neither its product name nor its description contains "fish"

#### Scenario: Duplicate keywords

- **GIVEN** the search text "fish fish koi"
- **WHEN** the search is run
- **THEN** it searches for the two distinct keywords "fish" and "koi"

#### Scenario: Mixed-case keyword

- **GIVEN** an en_US item whose product name is "Bulldog"
- **WHEN** a search for "Dog" is run in en_US
- **THEN** the item is returned

#### Scenario: Blank search text

- **GIVEN** the search text is empty or only whitespace
- **WHEN** the search is run
- **THEN** an empty result is returned and no search is performed

### Requirement: Catalog read paths and failure reporting

ID: SWHR2-R-0002
Recovered from: CAT-INT-0001
The system SHALL read catalog data through either of two equivalent read paths, a direct read from the web tier or a call to the catalog service, with the data-access implementation and the database dialect selected by deployment configuration, and SHALL report a catalog failure to the caller when the catalog store cannot be reached or queried.

#### Scenario: Both read paths agree

- **GIVEN** category "FISH" with en_US products "Angelfish" and "Koi"
- **WHEN** the products of "FISH" are read in en_US once directly from the web tier and once through the catalog service
- **THEN** both reads return the same products with the same details

#### Scenario: Data access selected by configuration

- **GIVEN** the deployment configuration names a data-access implementation and a database dialect
- **WHEN** the catalog is read
- **THEN** the configured implementation and dialect are used

#### Scenario: Catalog store unreachable

- **GIVEN** the catalog store cannot be reached
- **WHEN** a product list is requested
- **THEN** a catalog failure is reported to the caller instead of an empty or partial list
