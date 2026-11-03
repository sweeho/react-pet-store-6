## MODIFIED Requirements

### Requirement: Global navigation

ID: SWHR2-R-0289

The application SHALL render one global navigation on every page, with an entry for each primary area and a link back to the landing page. Each entry SHALL lead to a destination no other entry leads to, and only the entry for the page being shown SHALL be marked as the current page.

#### Scenario: Navigation is present on every page

ID: SWHR2-R-0289.01

- **WHEN** a user opens any page
- **THEN** the global navigation is shown
- **AND** it includes a link back to the landing page

#### Scenario: Shop group entries
ID: SWHR2-R-0289.02

- **GIVEN** the global navigation is shown
- **WHEN** the user looks at the Shop group
- **THEN** it lists exactly Catalog & search, Shopping cart and Language, and no Place order entry

#### Scenario: No two entries share a destination
ID: SWHR2-R-0289.03

- **GIVEN** the global navigation is shown
- **WHEN** the destinations of all its area entries are compared
- **THEN** every entry leads to a different page

#### Scenario: Only the current page's entry is highlighted
ID: SWHR2-R-0289.04

- **GIVEN** a user is on the shopping cart page
- **WHEN** the global navigation is shown
- **THEN** exactly one entry, Shopping cart, is marked as the current page
