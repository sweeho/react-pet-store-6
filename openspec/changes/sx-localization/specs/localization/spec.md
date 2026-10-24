## ADDED Requirements

### Requirement: Supported storefront locales

The storefront SHALL be available in exactly three locales, US English (en_US), Japanese (ja_JP) and Simplified Chinese (zh_CN), and SHALL provide every storefront page in each of them. US English (en_US) SHALL be the default locale.

#### Scenario: Each supported locale has a full page set

- **GIVEN** the storefront is deployed
- **WHEN** any storefront page is requested in en_US, ja_JP or zh_CN
- **THEN** the page is rendered with that locale's own localized text and layout

#### Scenario: Default locale

- **GIVEN** no locale has been chosen by the shopper
- **WHEN** a storefront page is rendered
- **THEN** it is rendered in US English (en_US)

### Requirement: Default locale for a new session

The system SHALL assign the configured default locale (en_US) to any user session that has no locale set, before any other handling of the request in that session.

#### Scenario: First request of a session

- **GIVEN** a new session with no locale recorded
- **WHEN** the first request in that session is handled
- **THEN** the session locale is set to en_US before the request is processed

#### Scenario: Session already carries a locale

- **GIVEN** a session whose locale is ja_JP
- **WHEN** a further request in that session is handled
- **THEN** the session locale remains ja_JP

### Requirement: Locale code interpretation

The system SHALL interpret a locale code of the form language_COUNTRY (for example en_US, ja_JP, zh_CN) as that language and country. The code "default", in any letter case, SHALL resolve to the server's default locale. A code that is absent or contains no underscore (for example "en") MUST NOT be resolved to a locale.

#### Scenario: Two-part code

- **GIVEN** the locale code "ja_JP"
- **WHEN** the code is interpreted
- **THEN** it resolves to language Japanese, country Japan

#### Scenario: The word default

- **GIVEN** the locale code "DEFAULT"
- **WHEN** the code is interpreted
- **THEN** it resolves to the server's default locale

#### Scenario: Code without an underscore

- **GIVEN** the locale code "en"
- **WHEN** the code is interpreted
- **THEN** no locale is resolved and the code is treated as invalid

### Requirement: Change session locale

The system SHALL let a user change the locale of their session by submitting a locale code. A recognised code MUST replace the session locale and MUST also be applied to the user's shopping cart. A code that cannot be resolved to a locale MUST be rejected with the error "Unable to change language to <code>", and the session locale MUST be left unchanged.

#### Scenario: Valid locale submitted

- **GIVEN** a shopper whose session locale is en_US and whose cart holds one item
- **WHEN** the shopper submits the locale code "zh_CN"
- **THEN** the session locale becomes zh_CN
- **AND** the cart lines are thereafter shown with zh_CN catalog content and prices

#### Scenario: Unrecognised locale submitted

- **GIVEN** a shopper whose session locale is en_US
- **WHEN** the shopper submits the locale code "fr"
- **THEN** the change is rejected with the error "Unable to change language to fr"
- **AND** the session locale remains en_US

### Requirement: Language switch from the storefront header

Every storefront page header SHALL offer three language controls, one each for English, Japanese and Chinese, each identified by its country flag, and each SHALL switch the session to en_US, ja_JP or zh_CN respectively. The shopper SHALL be able to use them from any page at any time.

#### Scenario: Shopper switches to Japanese

- **GIVEN** a shopper viewing any storefront page in US English
- **WHEN** the shopper activates the Japanese flag control in the header
- **THEN** the session locale becomes ja_JP and the storefront is shown in Japanese

### Requirement: Return to the originating page after a language change

WHEN a user changes language from a page that carries preserved page state, the system SHALL return the user to the page they came from, with that page's request data restored, rather than to a fixed landing page.

#### Scenario: Language changed on a product page

- **GIVEN** a shopper viewing the product page for product FI-SW-01 in English
- **WHEN** the shopper switches the language to Chinese from the header
- **THEN** the product page for FI-SW-01 is displayed again, now in Chinese

### Requirement: Change-language screen

The system SHALL provide a change-language screen that displays a single locale selector offering US English (en_US), German (de_DE), Japanese (ja_JP) and Simplified Chinese (zh_CN), and a "Change Locale" submit control. Submitting the form SHALL request a change of the session locale to the selected value. After a successful change the system SHALL display a confirmation screen stating the session's new locale code.

#### Scenario: The screen is displayed

- **GIVEN** a user with any session locale
- **WHEN** the change-language screen is displayed
- **THEN** it shows a locale selector with the options US English, German, Japanese and Simplified Chinese, and a "Change Locale" submit control

#### Scenario: A locale is selected and submitted

- **GIVEN** the change-language screen with "Japanese" selected
- **WHEN** the user activates "Change Locale"
- **THEN** the session locale becomes ja_JP
- **AND** a confirmation screen is displayed stating that the locale is ja_JP

#### Scenario: A locale without a page set is selected

- **GIVEN** the change-language screen with "German" selected
- **WHEN** the user activates "Change Locale"
- **THEN** the session locale becomes de_DE
- **AND** subsequent pages are rendered from the default (en_US) page set, because no German pages exist

### Requirement: Page locale resolution and fallback

The system SHALL choose the locale of each rendered page as follows: a locale supplied on the request SHALL take precedence over the session locale. IF no page set exists for the chosen locale THEN the default locale's page set SHALL be used. IF the requested page is not defined for the chosen locale THEN the default locale's version of that page SHALL be shown. IF the page is defined in neither THEN an error stating "Definition for screen <name> not found" SHALL be shown.

#### Scenario: Request locale overrides session locale

- **GIVEN** a session whose locale is en_US
- **WHEN** a page is requested with locale ja_JP on the request
- **THEN** the page is rendered in Japanese

#### Scenario: Locale without a page set

- **GIVEN** a session whose locale is de_DE and no German page set
- **WHEN** a page is requested
- **THEN** the page is rendered from the en_US page set

#### Scenario: Page missing from the chosen locale

- **GIVEN** a session whose locale is zh_CN and a page defined only for en_US
- **WHEN** that page is requested
- **THEN** the en_US version of that page is shown

#### Scenario: Page missing everywhere

- **GIVEN** a page name "unknown" defined in no locale
- **WHEN** that page is requested
- **THEN** an error stating "Definition for screen unknown not found" is shown

### Requirement: Locale-specific catalog content

The system SHALL hold category, product and item names, descriptions, images, attributes and prices separately for each locale, and SHALL select catalog content by the exact locale code (language_COUNTRY) of the request, so that the catalog is always shown in the shopper's current locale.

#### Scenario: Same item in two locales

- **GIVEN** item EST-1 has English and Japanese details
- **WHEN** EST-1 is viewed with locale ja_JP
- **THEN** the Japanese name, description and attributes are shown

#### Scenario: Locale with no catalog rows

- **GIVEN** no catalog details exist for locale de_DE
- **WHEN** catalog content is requested for de_DE
- **THEN** no localized details are returned for that locale

### Requirement: Separately stated price per locale

The system SHALL hold a separately stated list price and unit cost for each item in each locale, expressed in that locale's currency, and MUST NOT derive one locale's price by converting another's.

#### Scenario: Item prices per locale

- **GIVEN** item EST-1 priced 16.50 list / 10.00 unit cost in en_US, 1951 / 1551 in ja_JP and 142 / 86 in zh_CN
- **WHEN** EST-1 is displayed in each locale
- **THEN** each locale shows its own stated list price, with no conversion between them

### Requirement: Catalog text and currency formatting follow the page locale

Each localized storefront page SHALL show catalog content and format money in the locale of the page set being viewed: US English pages SHALL use en_US content and US currency formatting, Japanese pages ja_JP, and Chinese pages zh_CN.

#### Scenario: Cart viewed on Japanese pages

- **GIVEN** a shopper using the Japanese storefront with item EST-1 in the cart
- **WHEN** the cart page is displayed
- **THEN** the item text is the ja_JP catalog text and the price is formatted in Japanese yen

### Requirement: Cart follows the shopper's locale

The shopping cart SHALL show each line's name, attribute and price from the catalog in the shopper's current locale. A cart with no locale set SHALL default to US English. The cart locale SHALL be updated when the shopper changes locale and when the shopper signs on.

#### Scenario: New cart

- **GIVEN** a newly created cart with no locale set
- **WHEN** its lines are listed
- **THEN** catalog details are taken from en_US

#### Scenario: Locale changes after items are added

- **GIVEN** a cart holding item EST-1 shown in en_US
- **WHEN** the shopper changes locale to ja_JP
- **THEN** the EST-1 line shows its ja_JP name and price

### Requirement: UTF-8 decoding of storefront input

The system SHALL decode the character data of every incoming storefront request, including form fields and query parameters on every page, as UTF-8, and MUST do so before sign-on checking or any other request handling reads that data.

#### Scenario: Japanese text submitted in a form

- **GIVEN** a shopper enters a Japanese name in an address form
- **WHEN** the form is submitted
- **THEN** the stored name is identical to what the shopper entered

#### Scenario: Non-ASCII credentials at sign-on

- **GIVEN** a user whose user name contains Chinese characters
- **WHEN** the user submits the sign-on form
- **THEN** sign-on receives the user name already decoded as UTF-8

### Requirement: UTF-8 rendering of storefront pages

The system SHALL render every storefront page in UTF-8 and SHALL declare that encoding to the browser.

#### Scenario: Chinese page rendered

- **GIVEN** the storefront in zh_CN
- **WHEN** any page is returned to the browser
- **THEN** the response is encoded and declared as UTF-8

### Requirement: Request encoding is a deployment setting

The request decoding encoding SHALL be supplied by deployment configuration rather than fixed in code, and the shipped storefront configuration SHALL supply UTF-8.

#### Scenario: Configured encoding applied

- **GIVEN** the deployment configures the request encoding as UTF-8
- **WHEN** any storefront request arrives
- **THEN** its character data is decoded as UTF-8

### Requirement: Order locale is recorded

The system SHALL record on each purchase order the locale in which it was placed, SHALL restore that locale when the order is read back, and SHALL default the order locale to en_US when none is given.

#### Scenario: Order placed in Japanese

- **GIVEN** a shopper placing an order with locale ja_JP
- **WHEN** the order is stored and later read back
- **THEN** the order's locale is ja_JP

#### Scenario: Order with no locale

- **GIVEN** an order submitted without a locale
- **WHEN** the order is stored
- **THEN** its locale is en_US

### Requirement: Invoice locale default

The system SHALL treat an invoice that states no locale as en_US.

#### Scenario: Invoice without a locale

- **GIVEN** an invoice document with no locale stated
- **WHEN** the invoice is read
- **THEN** its locale is en_US

### Requirement: UTF-8 encoding of business documents

The system SHALL encode every business document it writes, including order approval batches, supplier orders and invoices, in UTF-8.

#### Scenario: Supplier order with Japanese address

- **GIVEN** an order whose ship-to address contains Japanese characters
- **WHEN** the supplier order document is written
- **THEN** the document is encoded in UTF-8 and the address characters are preserved

### Requirement: Customer e-mail price format per locale

Customer e-mails SHALL format unit prices according to the order's locale: as "$#,##0.00" for en_US and zh_CN, and as "￥#,##0" (yen, no decimal places) for ja_JP. An e-mail with no locale-specific format SHALL use the dollar format.

#### Scenario: Japanese invoice e-mail

- **GIVEN** an order placed in ja_JP with an item priced 1951
- **WHEN** the invoice e-mail is produced
- **THEN** the unit price reads "￥1,951"

#### Scenario: English completed-order e-mail

- **GIVEN** an order placed in en_US with an item priced 16.5
- **WHEN** the completed-order e-mail is produced
- **THEN** the unit price reads "$16.50"

### Requirement: Administration tool text catalogue

The administration tool SHALL take all labels, messages, tooltips and mnemonics from a localizable text catalogue selected by the user's locale, with English as the default and a German translation provided.

#### Scenario: German user

- **GIVEN** an administrator whose locale is German
- **WHEN** the administration tool is opened
- **THEN** its labels and messages are shown in German

#### Scenario: Locale without a translation

- **GIVEN** an administrator whose locale is Japanese
- **WHEN** the administration tool is opened
- **THEN** its labels and messages are shown in English

### Requirement: Locale-aware number formatting and keyword splitting

The system SHALL format money and numbers in a given locale with a fixed, caller-supplied number of decimal places, and SHALL split a search phrase into words using the word-boundary rules of a given locale, discarding blank words.

#### Scenario: Money formatted to two places

- **GIVEN** the amount 1234.5, locale en_US and precision 2
- **WHEN** the amount is formatted as money
- **THEN** the result is "$1,234.50"

#### Scenario: Search phrase split into words

- **GIVEN** the phrase " gold fish " and locale en_US
- **WHEN** the phrase is split into keywords
- **THEN** the keywords are "gold" and "fish"
