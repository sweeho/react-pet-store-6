## ADDED Requirements

### Requirement: Catalog category data

The system SHALL hold catalog categories, each identified by a mandatory, unique category id of at most 10 characters, and SHALL hold for each category, per locale, a mandatory name of at most 80 characters and an optional description of at most 255 characters, with at most one localized name and description per category per locale.

#### Scenario: Category localized in two locales

- **GIVEN** category "FISH" with an en_US name "Fish" and a ja_JP name
- **WHEN** the category is read in en_US
- **THEN** the name "Fish" and the en_US description are returned

#### Scenario: Second localized record for the same locale

- **GIVEN** category "FISH" already has an en_US name and description
- **WHEN** a second en_US name and description is stored for "FISH"
- **THEN** the store rejects it

### Requirement: Catalog product data

The system SHALL hold products, each identified by a unique product id of at most 10 characters and belonging to exactly one existing category, and SHALL hold for each product, per locale, a mandatory name of at most 80 characters and an optional description of at most 255 characters.

#### Scenario: Product referencing an unknown category

- **GIVEN** no category with id "LIZARDS" exists
- **WHEN** a product is stored with category id "LIZARDS"
- **THEN** the store rejects it

### Requirement: Catalog item data

The system SHALL hold sellable items, each identified by a unique item id of at most 10 characters and belonging to exactly one product, and SHALL hold for each item, per locale, a mandatory list price and a mandatory unit price (each a decimal with two fractional digits and at most 10 digits), a mandatory image location, a mandatory description of at most 255 characters, and up to five optional descriptive attributes of at most 80 characters each.

#### Scenario: Item without a unit price

- **GIVEN** an item "EST-1" belonging to product "FI-SW-01"
- **WHEN** its en_US details are stored without a unit price
- **THEN** the store rejects them

#### Scenario: Item with only some attributes

- **GIVEN** an item whose en_US details carry attribute 1 "Large" and no other attributes
- **WHEN** the item is read in en_US
- **THEN** attribute 1 is "Large" and attributes 2 to 5 are empty

### Requirement: Locale-scoped catalog content

The system SHALL return category, product and item content only in the locale requested and SHALL NOT fall back to another locale when no content exists in the requested locale.

#### Scenario: Category missing in the requested locale

- **GIVEN** category "DOGS" has en_US details and no zh_CN details
- **WHEN** category "DOGS" is requested in zh_CN
- **THEN** no category is returned and the en_US details are not substituted

### Requirement: Item visibility requires product localization

The system SHALL return an item in a locale only when both the item and its product have localized details in that same locale, and this SHALL apply to item lists, single-item lookups and search results alike.

#### Scenario: Item localized but its product is not

- **GIVEN** item "EST-1" has ja_JP details and its product "FI-SW-01" has no ja_JP details
- **WHEN** the items of "FI-SW-01" are listed, item "EST-1" is looked up, or a matching search is run in ja_JP
- **THEN** item "EST-1" is not returned by any of them

### Requirement: Category listing

The system SHALL list the catalog categories available in the requested locale, each with its id, localized name and localized description, ordered by localized category name, one page at a time.

#### Scenario: Categories listed in name order

- **GIVEN** en_US categories named "Fish", "Birds" and "Dogs"
- **WHEN** the first page of 5 categories is requested in en_US
- **THEN** the categories are returned in the order "Birds", "Dogs", "Fish"

### Requirement: Product listing for a category

The system SHALL list the products of a given category that have details in the requested locale, each with its id, localized name and localized description, ordered by localized product name, one page at a time.

#### Scenario: Products of a category in name order

- **GIVEN** category "FISH" with en_US products "Koi" and "Angelfish"
- **WHEN** the products of "FISH" are requested in en_US
- **THEN** "Angelfish" is returned before "Koi" and no product of another category is returned

### Requirement: Item listing for a product

The system SHALL list the items of a given product available in the requested locale, one page at a time, each carrying its category id, product name, item id, image location, description, five attributes, list price and unit price; the system MAY return the items in any order.

#### Scenario: Items of a product

- **GIVEN** product "FI-SW-01" has en_US items "EST-1" and "EST-2"
- **WHEN** the items of "FI-SW-01" are requested in en_US
- **THEN** both items are returned, each with its product name, description, attributes, list price and unit price

### Requirement: Single catalog entry lookup

The system SHALL return a single category, product or item by its id in the requested locale, and SHALL return no result, not an error, when no localized record exists for that id in that locale.

#### Scenario: Unknown item id

- **GIVEN** no item "EST-999" exists in en_US
- **WHEN** item "EST-999" is requested in en_US
- **THEN** an empty result is returned and no error is raised

### Requirement: Catalog list paging

The system SHALL page every catalog list (categories, products, items and search results) by a zero-based start position and a page size, returning at most page-size entries from the start position together with whether a next page and a previous page exist. A next page SHALL exist when at least one entry follows the returned page and SHALL start at start plus the number of entries returned. A previous page SHALL exist when start is greater than zero and SHALL start at the greater of zero and start minus the number of entries returned.

#### Scenario: Middle page of a list

- **GIVEN** a category with 5 products
- **WHEN** a page with start 2 and page size 2 is requested
- **THEN** products 3 and 4 are returned, a next page exists starting at 4, and a previous page exists starting at 0

#### Scenario: Start beyond the last entry

- **GIVEN** a category with 5 products
- **WHEN** a page with start 9 is requested
- **THEN** an empty page is returned with no next page and no error is raised

#### Scenario: Negative start

- **GIVEN** a category with 5 products
- **WHEN** a page with start -1 is requested
- **THEN** an empty page is returned with no next page

### Requirement: Default catalog page size

The system SHALL use a page size of 2 entries and a start position of 0 for a catalog list when the request supplies no paging values.

#### Scenario: Category page without paging values

- **GIVEN** a category with 5 products
- **WHEN** the category page is requested without a start or page size
- **THEN** the first 2 products are shown

### Requirement: Keyword parsing for catalog search

The system SHALL split catalog search text on whitespace into keywords and discard duplicate keywords, and SHALL return an empty result without searching when the text contains no keywords.

#### Scenario: Duplicate keywords

- **GIVEN** the search text "fish fish koi"
- **WHEN** the search is run
- **THEN** it searches for the two keywords "fish" and "koi"

#### Scenario: Blank search text

- **GIVEN** the search text is empty or only whitespace
- **WHEN** the search is run
- **THEN** an empty result is returned

### Requirement: Catalog keyword matching

The system SHALL return, for a search in the requested locale, every item for which at least one keyword occurs as a substring of the product's localized name, the category id, or the item's localized description, matching case-insensitively; results SHALL be paged and MAY be returned in any order.

#### Scenario: Any keyword matches

- **GIVEN** an en_US item whose product name is "Angelfish" and an en_US item whose description mentions "koi"
- **WHEN** a search for "angel koi" is run in en_US
- **THEN** both items are returned

#### Scenario: Category id matches

- **GIVEN** an item whose product belongs to category "FISH"
- **WHEN** a search for "fish" is run
- **THEN** the item is returned even if neither its product name nor its description contains "fish"

#### Scenario: Mixed-case keyword

- **GIVEN** an en_US item whose product name is "Bulldog"
- **WHEN** a search for "Dog" is run in en_US
- **THEN** the item is returned

### Requirement: Search results display

The search results page SHALL display the entered keywords and, for each matching item, its attributes and product name linking to the item detail page, its description, its unit price as currency and an Add to Cart control, two items per page with Previous and Next controls when earlier or later results exist; when the keywords are empty or nothing matches the page SHALL display "No results were found for your search."

#### Scenario: Matches found

- **GIVEN** a search for "fish" matching 3 items
- **WHEN** the search results page is displayed
- **THEN** it shows "Items matching any of: fish", the first 2 items each with name link, description, unit price and Add to Cart, and a Next control

#### Scenario: No matches

- **GIVEN** a search for "zebra" matching no item
- **WHEN** the search results page is displayed
- **THEN** it shows "No results were found for your search." and no item rows

### Requirement: Category navigation panel

Every storefront page SHALL display a side panel listing at most 5 catalog categories in the page's locale, ordered by category name, each linking to its category page.

#### Scenario: Panel on a storefront page

- **GIVEN** 5 en_US categories exist
- **WHEN** any storefront page is displayed in en_US
- **THEN** the side panel lists the 5 category names in name order, each linking to that category's page

### Requirement: Category page display

The category page SHALL display the products of the selected category, two per page, each showing its name linking to the product page and its description, with a Previous control when earlier products exist and a Next control when later products exist.

#### Scenario: First page of a category

- **GIVEN** category "FISH" with 3 products
- **WHEN** the category page for "FISH" is displayed without paging values
- **THEN** the first 2 products are shown with name links and descriptions, a Next control is shown, and no Previous control is shown

### Requirement: Product page display

The product page SHALL display the items of the selected product, two per page, each showing its attributes and product name linking to the item detail page, its description, its list price as currency and an Add to Cart control, with Previous and Next controls when earlier or later items exist.

#### Scenario: Items of a product shown

- **GIVEN** product "FI-SW-01" with items "EST-1" and "EST-2"
- **WHEN** the product page for "FI-SW-01" is displayed
- **THEN** both items are shown, each with a link to its item page, its description, its list price and an Add to Cart control

#### Scenario: Add to Cart from the product page

- **GIVEN** the product page shows item "EST-1"
- **WHEN** the shopper activates Add to Cart on "EST-1"
- **THEN** one "EST-1" is added to the shopper's cart

### Requirement: Home screen pet selection

The home screen SHALL display a pet selection picture whose regions link to the category pages for Birds, Fish, Dogs, Reptiles and Cats, alongside the category navigation panel.

#### Scenario: Home screen displayed

- **GIVEN** a shopper opens the storefront
- **WHEN** the home screen is displayed
- **THEN** the pet selection picture and the category navigation panel are shown

#### Scenario: Pet region selected

- **GIVEN** the home screen is displayed
- **WHEN** the shopper selects the Dogs region of the picture
- **THEN** the category page for category "DOGS" is displayed

### Requirement: Item detail screen

The item detail screen SHALL display the selected item's attributes and product name as its title, its image, its list price labelled "List Price", its unit price labelled "Your Price", both as currency, and an Add to Cart control that adds one of the item to the shopper's cart.

#### Scenario: Item detail displayed

- **GIVEN** item "EST-1" with list price 16.50 and unit price 10.00 in en_US
- **WHEN** the item detail screen for "EST-1" is displayed
- **THEN** it shows the item's title, its image, "List Price: $16.50", "Your Price: $10.00" and an Add to Cart control

#### Scenario: Add to Cart from the item screen

- **GIVEN** the item detail screen for "EST-1" is displayed
- **WHEN** the shopper activates Add to Cart
- **THEN** one "EST-1" is added to the shopper's cart

### Requirement: Shared cache of catalog pages

The system MAY serve the category page, the product page and the category navigation panel from a copy shared by all shoppers, keyed by page address and query, that SHALL be no older than 5 minutes; the item detail screen and search results SHALL always reflect current catalog data.

#### Scenario: Catalog change within the cache window

- **GIVEN** the "FISH" category page was rendered 2 minutes ago
- **WHEN** a product is added to "FISH" and any shopper requests the "FISH" category page
- **THEN** the page may omit the new product until 5 minutes after it was rendered

#### Scenario: Cache expired

- **GIVEN** the "FISH" category page was rendered 6 minutes ago
- **WHEN** a shopper requests it
- **THEN** it is rendered again from current catalog data

### Requirement: Anonymous catalog access

The system SHALL allow browsing categories, products and items, item lookup and search without the caller being signed in or holding any role.

#### Scenario: Anonymous shopper searches

- **GIVEN** a shopper who is not signed in
- **WHEN** they open a category page and run a search
- **THEN** both are served without a sign-in prompt

### Requirement: Catalog store failure

The system MUST report an error to the caller when the catalog store cannot be reached or a catalog query fails, and MUST NOT return an empty or partial result in its place.

#### Scenario: Database unavailable

- **GIVEN** the catalog store is unreachable
- **WHEN** a product list is requested
- **THEN** an error is reported instead of an empty list

### Requirement: Return to referring page

The system SHALL remember the last storefront page each shopper viewed and SHALL re-display it on a request for the previous page, and after a change-language request SHALL return the shopper to the page they came from with its request state restored.

#### Scenario: Language changed from a category page

- **GIVEN** a shopper viewing the second page of category "FISH"
- **WHEN** they change the language
- **THEN** they are returned to the second page of category "FISH" in the new language
