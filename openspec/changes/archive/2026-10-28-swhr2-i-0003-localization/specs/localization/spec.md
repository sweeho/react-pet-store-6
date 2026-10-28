## ADDED Requirements

### Requirement: Supported storefront locales and header language switch

ID: SWHR2-R-0078
Recovered from: LOC-REQ-0001
The storefront SHALL support the English (en_US), Japanese (ja_JP) and Chinese (zh_CN) locales with en_US as the default, SHALL provide every storefront screen in each of those locales, and SHALL let the shopper switch locale at any time from flag controls in the page header, one each for English, Japanese and Chinese.

#### Scenario: Each supported locale has a full screen set
ID: SWHR2-R-0078.01

- **GIVEN** the storefront is deployed
- **WHEN** any storefront screen is requested in en_US, ja_JP or zh_CN
- **THEN** the screen is rendered with that locale's own localized text and layout

#### Scenario: Default locale
ID: SWHR2-R-0078.02

- **GIVEN** a shopper who has not chosen a locale
- **WHEN** a storefront screen is rendered
- **THEN** it is rendered in US English (en_US)

#### Scenario: Shopper switches to Japanese from the header
ID: SWHR2-R-0078.03

- **GIVEN** a shopper viewing any storefront screen in US English
- **WHEN** the shopper activates the Japanese flag control in the header
- **THEN** the session locale becomes ja_JP and the storefront is shown in Japanese

### Requirement: Locale change applies to session and cart

ID: SWHR2-R-0076
Recovered from: LOC-BR-0002
WHEN the shopper changes locale THEN the system SHALL apply the new locale to the session and to the shopping cart, so that cart contents are shown with the new locale's catalog content and prices.

#### Scenario: Locale changed with items in the cart
ID: SWHR2-R-0076.01

- **GIVEN** a shopper whose session locale is en_US and whose cart holds item EST-1
- **WHEN** the shopper changes locale to zh_CN
- **THEN** the session locale becomes zh_CN
- **AND** the EST-1 cart line is shown with its zh_CN name and price

### Requirement: Locale code interpretation

ID: SWHR2-R-0077
Recovered from: LOC-BR-0003
The system SHALL interpret a locale code of the form language_COUNTRY (for example en_US, ja_JP) as that language and country. The code "default", in any letter case, SHALL resolve to the server's default locale. A code that contains no underscore (for example "en") MUST be treated as invalid and MUST NOT resolve to a locale.

#### Scenario: Two-part code
ID: SWHR2-R-0077.01

- **GIVEN** the locale code "ja_JP"
- **WHEN** the code is interpreted
- **THEN** it resolves to language Japanese, country Japan

#### Scenario: The word default
ID: SWHR2-R-0077.02

- **GIVEN** the locale code "DEFAULT"
- **WHEN** the code is interpreted
- **THEN** it resolves to the server's default locale

#### Scenario: Code without an underscore
ID: SWHR2-R-0077.03

- **GIVEN** the locale code "en"
- **WHEN** the code is interpreted
- **THEN** no locale is resolved and the code is treated as invalid

### Requirement: Page locale resolution and fallback

ID: SWHR2-R-0133
Recovered from: LOC-BR-0004
The system SHALL choose the locale of each rendered screen as follows: a locale supplied on the request SHALL take precedence over the session locale. IF no screen definitions exist for the chosen locale THEN the default locale's (en_US) definitions SHALL be used. IF the screen is not defined for the chosen locale THEN the default locale's definition of that screen SHALL be shown. IF the screen is defined in neither THEN an error stating "Definition for screen <name> not found" SHALL be shown.

#### Scenario: Request locale overrides session locale
ID: SWHR2-R-0133.01

- **GIVEN** a session whose locale is en_US
- **WHEN** a screen is requested with locale ja_JP on the request
- **THEN** the screen is rendered in Japanese

#### Scenario: Locale without screen definitions
ID: SWHR2-R-0133.02

- **GIVEN** a session whose locale is de_DE and no German screen definitions
- **WHEN** a screen is requested
- **THEN** the screen is rendered from the en_US definitions

#### Scenario: Screen missing from the chosen locale
ID: SWHR2-R-0133.03

- **GIVEN** a session whose locale is zh_CN and a screen defined only for en_US
- **WHEN** that screen is requested
- **THEN** the en_US version of that screen is shown

#### Scenario: Screen missing everywhere
ID: SWHR2-R-0133.04

- **GIVEN** a screen name "unknown" defined in no locale
- **WHEN** that screen is requested
- **THEN** an error stating "Definition for screen unknown not found" is shown

### Requirement: Locale-aware money and number formatting

ID: SWHR2-R-0018
Recovered from: LOC-BR-0007
The system SHALL format money and numbers in the user's locale with a fixed, caller-supplied number of decimal places.

#### Scenario: Money formatted to two places
ID: SWHR2-R-0018.01

- **GIVEN** the amount 1234.5, locale en_US and precision 2
- **WHEN** the amount is formatted as money
- **THEN** the result is "$1,234.50"

#### Scenario: Number formatted to zero places
ID: SWHR2-R-0018.02

- **GIVEN** the number 1951.4, locale ja_JP and precision 0
- **WHEN** the number is formatted
- **THEN** the result is "1,951"

### Requirement: Locale-aware formatting and keyword splitting

ID: SWHR2-R-0019
Recovered from: LOC-BR-0010
The system SHALL provide locale-aware formatting of money and numbers to a fixed number of decimal places, and SHALL split a search phrase into words using the word-boundary rules of a given locale, discarding blank words.

#### Scenario: Search phrase split into words
ID: SWHR2-R-0019.01

- **GIVEN** the phrase " gold fish " and locale en_US
- **WHEN** the phrase is split into keywords
- **THEN** the keywords are "gold" and "fish", and no blank keyword is returned

#### Scenario: Money formatted to a fixed precision
ID: SWHR2-R-0019.02

- **GIVEN** the amount 16.5, locale en_US and precision 2
- **WHEN** the amount is formatted as money
- **THEN** the result is "$16.50"

### Requirement: Change-language screen

ID: SWHR2-R-0020
Recovered from: LOC-SCR-0005
The system SHALL provide a change-language screen that displays a single locale selector offering US English (en_US), German (de_DE), Japanese (ja_JP) and Simplified Chinese (zh_CN), and a "Change Locale" submit control. Submitting the screen SHALL request a change of the session locale to the selected value. After a successful change the system SHALL display a confirmation stating the session's new locale.

#### Scenario: The screen is displayed
ID: SWHR2-R-0020.01

- **GIVEN** a user with any session locale
- **WHEN** the change-language screen is displayed
- **THEN** it shows a locale selector with the options US English, German, Japanese and Simplified Chinese, and a "Change Locale" submit control

#### Scenario: A locale is selected and submitted
ID: SWHR2-R-0020.02

- **GIVEN** the change-language screen with "Japanese" selected
- **WHEN** the user activates "Change Locale"
- **THEN** the session locale becomes ja_JP
- **AND** a confirmation is displayed stating that the locale is ja_JP

### Requirement: Catalog shown in the shopper's locale

ID: SWHR2-R-0079
Recovered from: LOCALIZATION-BR-0002
The system SHALL hold category, product and item display details per locale, and SHALL show the catalog in the shopper's current locale.

#### Scenario: Same item in two locales
ID: SWHR2-R-0079.01

- **GIVEN** item EST-1 has English and Japanese display details
- **WHEN** a shopper whose current locale is ja_JP views EST-1
- **THEN** the Japanese name, description and attributes are shown

#### Scenario: Shopper in English
ID: SWHR2-R-0079.02

- **GIVEN** item EST-1 has English and Japanese display details
- **WHEN** a shopper whose current locale is en_US views EST-1
- **THEN** the English name, description and attributes are shown

### Requirement: UTF-8 interpretation of submitted text

ID: SWHR2-R-0134
Recovered from: LOCALIZATION-REQ-0001
The system SHALL interpret all text submitted to the storefront, including form fields and request parameters on every page, as UTF-8, so that customers can enter text in any supported language, including Japanese and Chinese, without it being corrupted.

#### Scenario: Japanese text submitted in a form
ID: SWHR2-R-0134.01

- **GIVEN** a shopper enters a Japanese name in an address form
- **WHEN** the form is submitted and the address is later displayed
- **THEN** the displayed name is identical to what the shopper entered

#### Scenario: Chinese text in a query parameter
ID: SWHR2-R-0134.02

- **GIVEN** a search request whose keyword parameter contains Chinese characters
- **WHEN** the request is handled
- **THEN** the keyword is read as the same Chinese characters

### Requirement: Encoding established before sign-on

ID: SWHR2-R-0080
Recovered from: LOCALIZATION-RULE-0001
The system SHALL establish the request text encoding before any other request processing, including sign-on, reads submitted values, so that the values seen by sign-on and by every later step are already decoded as UTF-8.

#### Scenario: Non-ASCII credentials at sign-on
ID: SWHR2-R-0080.01

- **GIVEN** a user whose user name contains Chinese characters
- **WHEN** the user submits the sign-on form
- **THEN** sign-on receives the user name already decoded as UTF-8

#### Scenario: Non-ASCII form after sign-on
ID: SWHR2-R-0080.02

- **GIVEN** a signed-on shopper submits a form containing Japanese characters
- **WHEN** the request is processed
- **THEN** every handler of that request sees the values already decoded as UTF-8

### Requirement: Cart lines follow the cart locale

ID: SWHR2-R-0081
Recovered from: SC-BR-0006
The system SHALL show cart line details (name, attribute, price) from the catalog in the shopper's current locale, and SHALL default to US English when no locale has been set for the cart.

#### Scenario: New cart with no locale
ID: SWHR2-R-0081.01

- **GIVEN** a newly created cart with no locale set and item EST-1 added
- **WHEN** its lines are listed
- **THEN** the EST-1 name, attribute and price are taken from the en_US catalog details

#### Scenario: Cart with a locale
ID: SWHR2-R-0081.02

- **GIVEN** a cart whose locale is ja_JP holding item EST-1
- **WHEN** its lines are listed
- **THEN** the EST-1 name, attribute and price are taken from the ja_JP catalog details
