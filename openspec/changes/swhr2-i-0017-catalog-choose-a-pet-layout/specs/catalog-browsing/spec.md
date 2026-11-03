## MODIFIED Requirements

### Requirement: Home screen pet selection

ID: SWHR2-R-0041

The main page SHALL display a pet selection picture whose regions each link to one category, covering Birds, Fish, Dogs, Reptiles and Cats; selecting a region MUST open that category's page. The picture SHALL span the full width of its panel at any width, each pet's region SHALL sit directly above that pet's name cell, and the regions SHALL follow the picture's rendered size.

#### Scenario: Home screen displayed

ID: SWHR2-R-0041.01

- **GIVEN** the shopper opens the store's main page
- **WHEN** the page is displayed
- **THEN** a pet selection picture is shown with selectable regions for Birds, Fish, Dogs, Reptiles and Cats

#### Scenario: Pet region selected

ID: SWHR2-R-0041.02

- **GIVEN** the shopper is on the main page
- **WHEN** the shopper selects the Fish region
- **THEN** the category page for "FISH" opens

#### Scenario: Picture aligned with the names on a wide screen
ID: SWHR2-R-0041.03

- **GIVEN** the shopper views the main page with the picture's panel wider than 1000 px
- **WHEN** the page is displayed
- **THEN** the picture spans the panel's full width with no blank space either side, and each pet's region starts and ends within 2 px of the name cell below it

#### Scenario: Pet region selected on a wide screen
ID: SWHR2-R-0041.04

- **GIVEN** the shopper views the main page with the picture's panel about 1400 px wide
- **WHEN** the shopper selects the centre of the Cats picture cell
- **THEN** the category page for "CATS" opens

#### Scenario: Pet region selected on a narrow screen
ID: SWHR2-R-0041.05

- **GIVEN** the shopper views the main page with the picture's panel about 600 px wide
- **WHEN** the shopper selects the centre of the Dogs picture cell
- **THEN** the category page for "DOGS" opens
