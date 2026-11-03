## MODIFIED Requirements

### Requirement: Supported storefront locales and header language switch

ID: SWHR2-R-0078

The storefront SHALL support the English (en_US), Japanese (ja_JP) and Chinese (zh_CN) locales with en_US as the default, SHALL provide every storefront screen in each of those locales, and SHALL let the shopper switch locale at any time from flag controls in the page header, one each for English, Japanese and Chinese. A storefront screen's text, including the site's global navigation and footer, SHALL be shown in the session locale from the first time the screen is displayed.

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

#### Scenario: Site navigation and footer follow the session locale

- **GIVEN** a shopper whose session locale is ja_JP
- **WHEN** the shopper opens the storefront main page
- **THEN** the global navigation and the footer show their Japanese labels, and the page shows no English "Sign in" text

#### Scenario: Header follows a flag change without navigating

- **GIVEN** a shopper viewing the FISH category page in US English
- **WHEN** the shopper activates the Japanese flag control in the header
- **THEN** the header's main-page link, Cart, Account and Sign in labels change to Japanese on the same page

### Requirement: Change-language screen

ID: SWHR2-R-0020

The system SHALL provide a change-language screen that displays a single locale selector offering US English (en_US), German (de_DE), Japanese (ja_JP) and Simplified Chinese (zh_CN), and a "Change Locale" submit control. Submitting the screen SHALL request a change of the session locale to the selected value. After a successful change the system SHALL display a confirmation stating the session's new locale, and every storefront screen opened afterwards SHALL be shown in the new locale from the first time it is displayed.

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

#### Scenario: Next page opens in the new locale

- **GIVEN** a shopper who has just changed the locale to ja_JP on the change-language screen
- **WHEN** the shopper opens the storefront main page
- **THEN** the page is in Japanese when it is first displayed, with no US English version shown first
