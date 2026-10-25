## ADDED Requirements

### Requirement: Landing page

The application SHALL serve a landing page at its root route that introduces the product and links to every primary area.

#### Scenario: A user opens the root route

- **WHEN** a user opens the application's root URL
- **THEN** the landing page is shown
- **AND** it links to every primary area of the application

### Requirement: Global navigation

The application SHALL render one global navigation on every page, with an entry for each primary area and a link back to the landing page.

#### Scenario: Navigation is present on every page

- **WHEN** a user opens any page
- **THEN** the global navigation is shown
- **AND** it includes a link back to the landing page

### Requirement: Shared page layout

The application SHALL render every page inside one shared layout with a common header and footer.

#### Scenario: A page renders inside the shell

- **WHEN** a user opens any page
- **THEN** the page content renders inside the shared header, navigation and footer

### Requirement: Shared state frames

The application SHALL provide shared empty, error and loading frames that every page reuses.

#### Scenario: A page has nothing to show

- **WHEN** a page has no data to display
- **THEN** it renders the shared empty frame

#### Scenario: A page fails to load

- **WHEN** a page's data cannot be loaded
- **THEN** it renders the shared error frame with a way to retry
