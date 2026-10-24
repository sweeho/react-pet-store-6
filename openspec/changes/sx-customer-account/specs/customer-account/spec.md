## ADDED Requirements

### Requirement: Customer identity and record structure

The system SHALL hold exactly one customer record per user id, where the user id is the customer's unique identifier. Each customer SHALL own exactly one account and exactly one profile; each account SHALL own exactly one contact-information record and exactly one payment-card record; each contact-information record SHALL own exactly one postal address.

#### Scenario: A customer is looked up by user id

- **GIVEN** a customer registered under user id "j2ee"
- **WHEN** the customer record for "j2ee" is read
- **THEN** exactly one customer is returned, with one account (one contact record with one address, and one payment card) and one profile

### Requirement: Duplicate customer refused

The system MUST refuse to create a customer whose user id already belongs to an existing customer, and SHALL NOT create a second customer record for that user id.

#### Scenario: Second customer with an existing user id

- **GIVEN** a customer already exists with user id "j2ee"
- **WHEN** a new customer is created with user id "j2ee"
- **THEN** the creation is refused and only the original customer record exists

### Requirement: Account attributes and status

The system SHALL hold for each account a status, one contact-information record and one payment-card record, each of which SHALL be readable and replaceable. The defined status values SHALL be "active" and "disabled".

#### Scenario: Account contents are read

- **GIVEN** an existing customer account
- **WHEN** the account is read
- **THEN** its status, its contact information and its payment card are returned

### Requirement: Customer profile attributes

The system SHALL hold for each customer profile a preferred language, an optional favourite category, a MyList on/off preference and a pet-tips banner on/off preference, each readable and changeable. The MyList and banner preferences MUST always hold a yes or no value.

#### Scenario: Profile with no favourite category

- **GIVEN** a profile whose favourite category has never been set
- **WHEN** the profile is read
- **THEN** the favourite category is empty and the MyList and banner preferences each hold yes or no

### Requirement: Contact information record

The system SHALL record a contact as a given name, a family name, a telephone number and an e-mail address, each held as free text, together with exactly one postal address that belongs to that contact alone.

#### Scenario: Contact details are read

- **GIVEN** a stored contact with given name "ABC", family name "XYZ", telephone "555-555-5555" and e-mail "abc@example.com"
- **WHEN** the contact is read
- **THEN** those four values are returned together with the contact's one postal address

### Requirement: Postal address record

The system SHALL hold a postal address as six free-text values: street line 1, an optional street line 2, city, state, zip code and country. Each address SHALL be identified by a system-generated key with no business meaning; two addresses with identical content SHALL remain separate records.

#### Scenario: Identical addresses stay separate

- **GIVEN** two contacts who live at the same street address
- **WHEN** both addresses are stored
- **THEN** two distinct address records exist, each with its own generated key

### Requirement: Payment card record

The system SHALL hold for a customer's payment card exactly three free-text attributes: card number, card type and expiry date. A card record MAY exist with all three attributes empty.

#### Scenario: Card attributes are read

- **GIVEN** a stored card with number "4111-1111-1111-1111", type "Java(TM) Card" and expiry "05/2004"
- **WHEN** the card is read
- **THEN** exactly those three values are returned and no other card attribute is held

### Requirement: Customer creation defaults

WHEN a customer is created, the system SHALL create in the same operation an account with status "active" and a profile with preferred language "en_US", no favourite category, MyList on and banners on.

#### Scenario: New customer starts active with default preferences

- **GIVEN** no customer exists for user id "newbie"
- **WHEN** a customer is created for "newbie"
- **THEN** the customer's account status is "active" and the profile holds language "en_US", no favourite category, MyList on and banners on

### Requirement: Blank dependent records on account creation

WHEN an account is created from a status alone, the system SHALL create an empty contact-information record carrying a new empty postal address, and an empty payment-card record, and attach both to the account. WHEN an account is created with supplied contact information and payment card, the system SHALL attach those instead. IF the dependent address cannot be created THEN the contact-information record MUST NOT be created.

#### Scenario: Account created from status only

- **GIVEN** a new customer being set up
- **WHEN** its account is created with status "active" and no details
- **THEN** the account has a contact record with blank names, telephone and e-mail, a blank address, and a card record with no number, type or expiry

#### Scenario: Account created with supplied details

- **GIVEN** a contact record and a card record that already exist
- **WHEN** an account is created with status "active", that contact record and that card record
- **THEN** the account is linked to the supplied records and no blank records are created

#### Scenario: Contact created from a complete contact value

- **GIVEN** a complete set of contact details including an address
- **WHEN** a contact record is created from it
- **THEN** the contact receives a new address copied from the supplied address

### Requirement: Atomic customer creation

The system MUST create a customer together with its account, profile, contact information, address and payment card as one unit of work, joining the caller's unit of work when one exists. IF creation of any dependent record fails THEN no customer SHALL remain without its account and profile.

#### Scenario: Profile creation fails

- **GIVEN** a customer is being created for user id "newbie"
- **WHEN** the profile cannot be created
- **THEN** no customer record for "newbie" remains

### Requirement: Cascading removal of customer data

WHEN a customer is removed, the system SHALL also remove its account and profile; WHEN an account is removed, the system SHALL also remove its contact information and payment card; WHEN contact information is removed, the system SHALL also remove its postal address, in the same unit of work.

#### Scenario: Customer removed

- **GIVEN** a customer with an account, profile, contact record, address and payment card
- **WHEN** the customer is removed
- **THEN** none of the account, profile, contact record, address or card remains

### Requirement: No record-level access control on customer data

The customer-data records (address, contact information, payment card) SHALL NOT apply a role check of their own; access to them MUST be controlled by the operation that owns them. Every read and update of these records SHALL run inside a unit of work, joining the caller's when one exists.

#### Scenario: Internal caller reads a card

- **GIVEN** an internal component acting for any caller identity
- **WHEN** it reads a stored card's number
- **THEN** the record returns the value without performing a role check

### Requirement: Field-level update and detached copies

The system SHALL allow each part of a stored address and contact record to be changed individually after creation, and SHALL provide the whole address or contact record as a detached copy whose later modification does not alter the stored record.

#### Scenario: Detached address copy is modified

- **GIVEN** a stored address with city "Palo Alto"
- **WHEN** a copy of the address is taken and its city is changed to "Austin"
- **THEN** the stored address still has city "Palo Alto"

#### Scenario: Single address field updated

- **GIVEN** a stored address
- **WHEN** only its zip code is changed
- **THEN** the zip code is updated and the other five values are unchanged

### Requirement: Address storage without content validation

The system SHALL store an address without validating its contents: an address MAY be created empty, from six values, or copied from another address, and any value MAY be blank at the point of storage. No format SHALL be enforced on zip code, state or country.

#### Scenario: Blank address stored

- **GIVEN** a new contact record
- **WHEN** an address is created with every value unset
- **THEN** the address is stored and can be filled in later

### Requirement: Exchanged address document reading

WHEN an address is received as a document, the system SHALL require its parts in the fixed order street line 1, optional street line 2, city, state, zip code, country; it MUST reject the document, naming the missing or empty part, unless street line 1, city, state, zip code and country are each present and non-empty, and a street line 2, if present, is non-empty.

#### Scenario: Address document without a city

- **GIVEN** an address document containing street line 1, state, zip code and country but no city
- **WHEN** the document is read
- **THEN** it is rejected with an error naming the city part

#### Scenario: Address document with parts out of order

- **GIVEN** an address document whose city appears after its state
- **WHEN** the document is read
- **THEN** it is rejected

#### Scenario: Address document with one street line

- **GIVEN** a complete address document carrying a single street line
- **WHEN** the document is read
- **THEN** the address is accepted and street line 2 is empty

### Requirement: Exchanged address document writing

WHEN an address is written as a document, the system SHALL emit street line 1, then street line 2 only if it is present and non-empty, then city, state, zip code and country, in that order; a part other than street line 2 that has no value SHALL be emitted with empty content rather than omitted.

#### Scenario: Address with blank second line and no country written

- **GIVEN** a stored address whose street line 2 is blank and whose country is unset
- **WHEN** the address is written as a document
- **THEN** the document has one street line and a country part with empty content

### Requirement: Payment card stored as supplied

The system SHALL store a card's number, type and expiry date exactly as supplied, without validating card-number format or check digit, card type against a list of brands, or whether the expiry date is in the past. A blank card number SHALL NOT prevent an account from being saved.

#### Scenario: Expired card saved

- **GIVEN** a customer entering card number "1234" with expiry "01/2001"
- **WHEN** the account is saved
- **THEN** the card is stored with those values and no error is shown

### Requirement: Card expiry month and year

The system SHALL store a card's expiry date as a single "month/year" text value, deriving the expiry month as the text before the first "/" and the expiry year as the text after it. GIVEN the stored expiry is empty or contains no "/", the system SHALL report month "01" and year "2010".

#### Scenario: Well-formed expiry

- **GIVEN** a card with expiry "05/2004"
- **WHEN** its expiry month and year are requested
- **THEN** month "05" and year "2004" are returned

#### Scenario: Missing expiry

- **GIVEN** a card whose expiry date is empty
- **WHEN** its expiry month and year are requested
- **THEN** month "01" and year "2010" are returned

### Requirement: Two-step account sign-up

The system SHALL let a first-time visitor create an account from the sign-in page in two steps: first a user name and password are registered; then the account information (contact details, payment card and profile preferences) is captured. WHEN the second step is saved, the system SHALL create the customer keyed by the registered user id, store the submitted details, mark the visitor as signed on, and return them to the page they were trying to reach before signing in, or to the home page if that page was the account page.

#### Scenario: Visitor signs up while heading to checkout

- **GIVEN** a visitor who was sent to the sign-in page while trying to reach checkout
- **WHEN** they register a new user name and password and then submit the account information form
- **THEN** a customer exists for that user name with the submitted details, the visitor is signed on, and they are returned to checkout

#### Scenario: Visitor signs up from the account link

- **GIVEN** a visitor who reached the sign-in page by asking for their account page
- **WHEN** they complete both sign-up steps
- **THEN** they are signed on and taken to the home page

### Requirement: Unique user names at sign-up

The system MUST keep sign-on user names unique. GIVEN a user name that is already registered, WHEN a new account is requested with it, THEN the system SHALL refuse it and show "The User name you have chosen is in use. Please choose another username."

#### Scenario: Taken user name

- **GIVEN** user name "j2ee" is already registered
- **WHEN** a visitor submits the sign-up form with user name "j2ee"
- **THEN** no account is created and the user-name-in-use message is shown

### Requirement: Sign-up failures reported as a taken user name

GIVEN sign-up fails for any reason, including the sign-on service being unavailable, WHEN the visitor submits the sign-up form, THEN the system SHALL report the failure with the user-name-in-use message.

#### Scenario: Sign-on service unavailable

- **GIVEN** the sign-on service cannot be reached
- **WHEN** a visitor submits the sign-up form with an unused user name
- **THEN** the user-name-in-use message is shown and no account is created

### Requirement: Sign-on user name and password rules

The system MUST refuse to register a user name longer than 25 characters or containing a "%" or "\*" character, and MUST refuse a password longer than the configured maximum password length.

#### Scenario: User name too long

- **GIVEN** a requested user name of 26 characters
- **WHEN** the sign-on account is created
- **THEN** creation is refused and no account exists for that name

#### Scenario: User name with a wildcard character

- **GIVEN** a requested user name "pet\*lover"
- **WHEN** the sign-on account is created
- **THEN** creation is refused

### Requirement: Password entered twice at sign-up

The sign-up form SHALL collect the password twice, and the system SHALL create the sign-on account using the first password field; the legacy system SHALL NOT compare the repeated password with the first.

#### Scenario: Mismatched repeated password

- **GIVEN** a visitor enters password "alpha" and repeated password "beta"
- **WHEN** they submit the sign-up form with an unused user name
- **THEN** the account is created with password "alpha" and no mismatch error is shown

### Requirement: Account information captured

The system SHALL capture for each customer: first and last name, street address line 1, optional street address line 2, city, state or province, postal code, country, telephone and e-mail; a payment card number, card type and expiry month and year; and profile preferences of preferred language (English, Japanese or Chinese), favourite category (Birds, Cats, Dogs, Fish or Reptiles), MyList on/off and pet-tips banners on/off. On the sign-up form the preferred language SHALL default to English and the favourite category to Birds. The card types offered SHALL be Java(TM) Card, Duke Express and Meow Card, and the expiry year SHALL be chosen from a fixed list. A MyList or banner preference SHALL be on only when its box is ticked.

#### Scenario: Sign-up account information form submitted with boxes unticked

- **GIVEN** a visitor on the account information form after registering a user name
- **WHEN** they fill in the contact and card fields, leave language and category at their defaults and leave both preference boxes unticked
- **THEN** the customer is stored with language English, favourite category Birds, MyList off and banners off

### Requirement: Required contact fields

The system SHALL treat first name, last name, street address line 1, city, state or province, postal code and telephone as required contact fields, and street line 2 and e-mail as optional. GIVEN any required contact field is blank, WHEN the account is created or updated, THEN the details MUST NOT be saved.

#### Scenario: Blank city on account update

- **GIVEN** a signed-on customer editing their account
- **WHEN** they clear the city field and save
- **THEN** the account details are not changed

### Requirement: Browser-side empty-field check

On forms that mark fields as validated, the system SHALL block submission in the browser WHEN any marked field is empty, and SHALL tell the user "<field name> is empty." for each empty marked field; this check SHALL NOT test format, length or range.

#### Scenario: Edit form submitted with an empty telephone

- **GIVEN** the account edit form with the telephone field cleared
- **WHEN** the customer presses Update
- **THEN** the form is not submitted and the customer is told the telephone field is empty

### Requirement: Account screen

The account screen SHALL be available to a signed-on customer and SHALL display the customer's first and last name, both street lines, city, state or province, postal code, country, telephone and e-mail; the card type, card number and expiry month / year; the preferred language and favourite category as their display names; and the MyList and pet-tips banner preferences each as Yes or No. The screen MUST be read-only and MUST offer an "Edit Your Account Information" link that opens the account edit form.

#### Scenario: Signed-on customer opens the account screen

- **GIVEN** a signed-on customer whose profile holds language "ja_JP", favourite category "FISH", MyList on and banners off
- **WHEN** the account screen is displayed
- **THEN** it shows their contact details and address, the card type, card number and expiry as month / year, language "Japanese", favourite category "Fish", MyList "Yes" and banners "No", with no editable fields

#### Scenario: Customer chooses to edit

- **GIVEN** a signed-on customer on the account screen
- **WHEN** they follow the "Edit Your Account Information" link
- **THEN** the account edit form opens pre-filled with every value shown on the account screen

### Requirement: Account edit

The system SHALL let a signed-on customer edit and save every account value shown on the account screen: contact details and address, card number, type and expiry, preferred language, favourite category and the MyList and banner preferences.

#### Scenario: Customer changes favourite category

- **GIVEN** a signed-on customer whose favourite category is Birds
- **WHEN** they change it to Reptiles on the edit form and press Update
- **THEN** the stored profile holds favourite category Reptiles and the account screen shows Reptiles

### Requirement: Preferred language on account save

WHEN a customer saves their account, the system SHALL store the chosen preferred language in the profile and record it for the current session; the language of the shopping cart and of orders placed in the same session SHALL NOT be switched by this save, and the stored preference SHALL take effect from the customer's next sign-on.

#### Scenario: Language changed then order placed in the same visit

- **GIVEN** a signed-on customer shopping in English
- **WHEN** they change their preferred language to Japanese, save, and place an order in the same visit
- **THEN** the profile holds Japanese and the order carries the English locale

### Requirement: My List panel

GIVEN a signed-on customer whose MyList preference is on, the system SHALL show beside the page body a My List panel listing up to the first 10 products of the customer's favourite category, each linking to its product page, in the page's language. GIVEN the preference is off, no panel SHALL be shown.

#### Scenario: Favourite category with more than ten products

- **GIVEN** a signed-on customer with MyList on and favourite category Fish containing 12 products
- **WHEN** a page carrying the My List panel is displayed
- **THEN** the panel lists the first 10 Fish products, each linking to its product page

#### Scenario: MyList off

- **GIVEN** a signed-on customer with MyList off
- **WHEN** any page is displayed
- **THEN** no My List panel is shown

### Requirement: Pet-tips banner

GIVEN a signed-on customer whose banner preference is on, the system SHALL show on the home and cart pages only a pet-tips banner for the customer's favourite category (dogs, cats, reptiles, birds or fish), and SHALL use the dogs banner for any other category.

#### Scenario: Banner for a known category

- **GIVEN** a signed-on customer with banners on and favourite category Cats
- **WHEN** the home page is displayed
- **THEN** the cats pet-tips banner is shown

#### Scenario: Banner fallback

- **GIVEN** a signed-on customer with banners on and a favourite category other than the five named
- **WHEN** the cart page is displayed
- **THEN** the dogs pet-tips banner is shown
