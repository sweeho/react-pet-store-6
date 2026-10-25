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

### Requirement: Item visible only where its product is localized

ID: SWHR2-R-0127
Recovered from: CAT-BR-0001
The system SHALL show an item in a locale only when both the item and its product have localized details in that same locale, and SHALL NOT return the item from an item listing, item lookup or search in a locale where its product has no localized details.

#### Scenario: Product not localized

- **GIVEN** item "EST-1" has ja_JP details but its product "FI-SW-01" has no ja_JP details
- **WHEN** the items of "FI-SW-01" are listed, "EST-1" is looked up, or a matching search is run in ja_JP
- **THEN** "EST-1" is not returned

#### Scenario: Item and product both localized

- **GIVEN** item "EST-1" and its product "FI-SW-01" both have en_US details
- **WHEN** "EST-1" is looked up in en_US
- **THEN** the item is returned with its en_US details

### Requirement: Default catalog paging

ID: SWHR2-R-0035
Recovered from: CAT-BR-0004
The system SHALL use a default catalog page size of 2 entries and a default start position of 0 when the caller does not supply them.

#### Scenario: No paging values supplied

- **GIVEN** category "FISH" contains 4 products
- **WHEN** the products of "FISH" are requested without a start position or page size
- **THEN** the first 2 products are returned

#### Scenario: Only a page size supplied

- **GIVEN** category "FISH" contains 4 products
- **WHEN** the products of "FISH" are requested with page size 3 and no start position
- **THEN** products 1 through 3 are returned

### Requirement: Shared five-minute cache of catalog pages

ID: SWHR2-R-0036
Recovered from: CAT-BR-0007
The system SHALL cache the rendered category product list, product item list and category navigation panel for 5 minutes, shared across all shoppers and kept separately for each category, product and paging position, so that a catalog change MAY take up to 5 minutes to appear on those pages. The item detail page and search results SHALL NOT be cached.

#### Scenario: Change appears within five minutes

- **GIVEN** a shopper has viewed the product list of category "FISH"
- **WHEN** a product is added to "FISH" and any shopper views the "FISH" product list 6 minutes later
- **THEN** the new product is shown

#### Scenario: Cached copy reused across shoppers

- **GIVEN** shopper A viewed the product list of category "FISH" 1 minute ago
- **WHEN** a product name in "FISH" is changed and shopper B views the "FISH" product list
- **THEN** shopper B MAY see the product list as it was rendered for shopper A

#### Scenario: Item detail not cached

- **GIVEN** an item's unit price has just changed
- **WHEN** a shopper opens that item's detail page
- **THEN** the new unit price is shown

### Requirement: Catalog hierarchy

ID: SWHR2-R-0037
Recovered from: CAT-ENT-0001
The system SHALL hold the catalog as a three-level hierarchy of categories, products and items, where every product belongs to exactly one category and every item belongs to exactly one product, and SHALL hold the name, description and image of each category, product and item per locale, with an item's list price and unit cost both mandatory in every locale in which the item is held.

#### Scenario: Product without a category is refused

- **GIVEN** no category "INSECTS" exists
- **WHEN** a product is stored with category "INSECTS"
- **THEN** the product is rejected

#### Scenario: Item localization without prices is refused

- **GIVEN** item "EST-1" exists
- **WHEN** en_US details for "EST-1" are stored without a list price or without a unit cost
- **THEN** the details are rejected

#### Scenario: Per-locale details

- **GIVEN** product "FI-SW-01" has en_US name "Angelfish" and ja_JP name "エンゼルフィッシュ"
- **WHEN** the product is read in ja_JP
- **THEN** its name is "エンゼルフィッシュ"

### Requirement: List categories

ID: SWHR2-R-0038
Recovered from: CAT-REQ-0001
The system SHALL list the catalog categories available in the requested locale, sorted by localized category name, returning one page of at most the requested number of categories starting at the requested zero-based position.

#### Scenario: Categories sorted by name

- **GIVEN** en_US categories named "Reptiles", "Birds" and "Fish"
- **WHEN** categories are listed in en_US from position 0 with page size 10
- **THEN** "Birds", "Fish", "Reptiles" are returned in that order

#### Scenario: Page within the list

- **GIVEN** 5 categories in en_US
- **WHEN** categories are listed from position 2 with page size 2
- **THEN** the 3rd and 4th categories by name are returned

#### Scenario: Category not localized

- **GIVEN** category "REPTILES" has no zh_CN details
- **WHEN** categories are listed in zh_CN
- **THEN** "REPTILES" is not returned

### Requirement: Category product list with Previous and Next

ID: SWHR2-R-0039
Recovered from: CAT-REQ-0003
The system SHALL list the products of a selected category ordered by product name, in pages that start at the first product with a page size of 2, and SHALL offer a Previous control whenever an earlier page exists and a Next control whenever a later page exists.

#### Scenario: First page of a category

- **GIVEN** category "DOGS" has products "Poodle", "Bulldog", "Dalmation" in en_US
- **WHEN** the shopper opens "DOGS"
- **THEN** "Bulldog" and "Dalmation" are shown, a Next control is offered and no Previous control is offered

#### Scenario: Last page of a category

- **GIVEN** the shopper is on the first page of "DOGS" with 3 products
- **WHEN** the shopper selects Next
- **THEN** "Poodle" is shown, a Previous control is offered and no Next control is offered

### Requirement: Item detail page

ID: SWHR2-R-0040
Recovered from: CAT-REQ-0005
The system SHALL show an item detail page with the item's image, its list price labelled "List Price", its selling price (the unit cost) labelled "Your Price", and an Add to Cart action that adds the item to the shopper's cart.

#### Scenario: Item detail displayed

- **GIVEN** item "EST-1" with list price 16.50 and unit cost 10.00 in en_US
- **WHEN** the shopper opens the detail page of "EST-1"
- **THEN** the page shows the item's image, "List Price" 16.50, "Your Price" 10.00 and an Add to Cart action

#### Scenario: Add to Cart from item detail

- **GIVEN** the shopper is on the detail page of "EST-1"
- **WHEN** the shopper chooses Add to Cart
- **THEN** "EST-1" is added to the shopper's cart

### Requirement: Home screen pet selection

ID: SWHR2-R-0041
Recovered from: CAT-SCR-0001
The main page SHALL display a pet selection picture whose regions each link to one category, covering Birds, Fish, Dogs, Reptiles and Cats; selecting a region MUST open that category's page.

#### Scenario: Home screen displayed

- **GIVEN** the shopper opens the store's main page
- **WHEN** the page is displayed
- **THEN** a pet selection picture is shown with selectable regions for Birds, Fish, Dogs, Reptiles and Cats

#### Scenario: Pet region selected

- **GIVEN** the shopper is on the main page
- **WHEN** the shopper selects the Fish region
- **THEN** the category page for "FISH" opens

### Requirement: Home screen and category navigation panel

ID: SWHR2-R-0042
Recovered from: CAT-SCR-0002
The system SHALL present a home screen with a pet selection map whose regions link to the Birds, Fish, Dogs, Reptiles and Cats categories, and SHALL show on every storefront screen a side panel listing the catalog categories in the current locale ordered by name, each entry linking to that category's page.

#### Scenario: Side panel on every screen

- **GIVEN** en_US categories "Birds", "Cats", "Dogs", "Fish", "Reptiles"
- **WHEN** the shopper views the home screen, a category page, a product page or an item page in en_US
- **THEN** a side panel lists "Birds", "Cats", "Dogs", "Fish", "Reptiles" in that order

#### Scenario: Side panel entry selected

- **GIVEN** the side panel is displayed
- **WHEN** the shopper selects "Reptiles"
- **THEN** the category page for "REPTILES" opens

### Requirement: Locale-scoped catalog descriptions

ID: SWHR2-R-0043
Recovered from: CATALOG-BROWSING-BR-0001
The system SHALL hold category, product and item descriptions per locale and SHALL show a shopper only the descriptions for the shopper's current locale; the category list SHALL be ordered by category name.

#### Scenario: Shopper sees own locale only

- **GIVEN** item "EST-1" has an en_US description and a ja_JP description
- **WHEN** a shopper whose current locale is ja_JP views "EST-1"
- **THEN** only the ja_JP description is shown

### Requirement: Category code is mandatory and unique

ID: SWHR2-R-0044
Recovered from: CATALOG-BROWSING-ENT-0001
The system SHALL identify each catalog category by a mandatory, unique category code of up to 10 characters.

#### Scenario: Duplicate category code

- **GIVEN** category "FISH" exists
- **WHEN** another category with code "FISH" is stored
- **THEN** it is rejected

#### Scenario: Missing category code

- **GIVEN** a new category
- **WHEN** it is stored without a category code
- **THEN** it is rejected

### Requirement: Category identifier length

ID: SWHR2-R-0045
Recovered from: CATALOG-BROWSING-ENTITY-0001
The system SHALL identify each catalog category by a mandatory, unique category id of at most 10 characters.

#### Scenario: Over-long category id

- **GIVEN** a new category
- **WHEN** it is stored with the 11-character id "AMPHIBIANS1"
- **THEN** it is rejected

#### Scenario: Ten-character category id

- **GIVEN** a new category
- **WHEN** it is stored with the 10-character id "AMPHIBIANS"
- **THEN** it is accepted

### Requirement: Localized catalog details

ID: SWHR2-R-0046
Recovered from: CATALOG-BROWSING-REQ-0001
The system SHALL store category, product and item descriptive details per locale and SHALL show the shopper the details for the shopper's current locale; category lists SHALL be ordered by category name.

#### Scenario: Category names in shopper's locale

- **GIVEN** category "FISH" has en_US name "Fish" and ja_JP name "魚"
- **WHEN** a shopper whose current locale is ja_JP lists categories
- **THEN** the category is shown as "魚" in name order among the ja_JP category names

### Requirement: Browse from home to item

ID: SWHR2-R-0047
Recovered from: CATALOG-BROWSING-WF-0001
The system SHALL let a shopper navigate from the home page to a category, from a category to a product, and from a product to the list of that product's items, and each item row SHALL offer an add-to-cart action.

#### Scenario: Navigate to a product's items

- **GIVEN** the shopper is on the home page
- **WHEN** the shopper selects category "DOGS" and then product "Bulldog"
- **THEN** the items of "Bulldog" are listed, each row with an add-to-cart action

#### Scenario: Add an item from the product's item list

- **GIVEN** the shopper is viewing the items of "Bulldog"
- **WHEN** the shopper chooses add-to-cart on item "Male Adult Bulldog"
- **THEN** that item is added to the shopper's cart

### Requirement: Search keyword tokenization

ID: SWHR2-R-0048
Recovered from: CATB-RULE-0008
The system SHALL split a catalog search query into keywords on whitespace (space, tab, line break or form feed) and discard duplicate keywords; when the query contains no keywords the system SHALL return an empty result without querying the catalog.

#### Scenario: Tabs and repeated words

- **GIVEN** the search query "koi\tkoi angel"
- **WHEN** the search is run
- **THEN** it searches for the two keywords "koi" and "angel"

#### Scenario: Whitespace-only query

- **GIVEN** the search query " "
- **WHEN** the search is run
- **THEN** an empty result is returned and the catalog is not queried
