# customer-account Specification

## Purpose

TBD - created by archiving change swhr2-i-0006-customer-account-and-profil. Update Purpose after archive.

## Requirements

### Requirement: Password entered twice at sign-up

ID: SWHR2-R-0009
Recovered from: ACCT-BR-0003
The system SHALL collect a repeated password when a new user name is registered. The system MUST check that each of the two password fields is not empty before the registration is submitted; no check that the two passwords match is made.

#### Scenario: Both password fields filled with the same value

ID: SWHR2-R-0009.01

- **GIVEN** a visitor registering the user name "j2ee"
- **WHEN** the visitor enters the same non-empty password in both password fields and submits
- **THEN** the registration proceeds with that user name and the first password

#### Scenario: A password field left empty

ID: SWHR2-R-0009.02

- **GIVEN** a visitor registering a new user name
- **WHEN** the visitor leaves the repeated password field empty and submits
- **THEN** the submission is refused before it reaches the server and the empty field is reported

#### Scenario: The two passwords differ

ID: SWHR2-R-0009.03

- **GIVEN** a visitor registering a new user name
- **WHEN** the visitor enters two different non-empty passwords and submits
- **THEN** the registration proceeds using the first password and no mismatch is reported

### Requirement: Payment card type and expiry year options

ID: SWHR2-R-0010
Recovered from: ACCT-RULE-0009
The system SHALL offer the payment card types Java(TM) Card, Duke Express and Meow Card, and SHALL offer card expiry years only from a fixed list.

#### Scenario: Card type choices on the account form

ID: SWHR2-R-0010.01

- **GIVEN** a customer filling in the account information form
- **WHEN** the customer opens the card type choice
- **THEN** exactly the options Java(TM) Card, Duke Express and Meow Card are offered

#### Scenario: Expiry year choices on the account form

ID: SWHR2-R-0010.02

- **GIVEN** a customer filling in the account information form
- **WHEN** the customer opens the card expiry year choice
- **THEN** only years from the fixed list are offered and no free-text year can be entered

### Requirement: Customer profile defaults at creation

ID: SWHR2-R-0011
Recovered from: CUST-BR-0003
WHEN a customer profile is created at customer creation THEN the system SHALL set the preferred language to "en_US", leave the favourite category unset, turn the MyList preference on, and turn the banner preference on.

#### Scenario: New customer created without profile choices

ID: SWHR2-R-0011.01

- **GIVEN** no customer exists for the user id "j2ee"
- **WHEN** a customer is created for "j2ee" and no profile values are supplied
- **THEN** the customer's profile has preferred language "en_US", no favourite category, the MyList preference on and the banner preference on

#### Scenario: Profile values supplied after creation

ID: SWHR2-R-0011.02

- **GIVEN** a customer just created with the default profile
- **WHEN** the creating flow then stores the preferred language "ja_JP" and favourite category "BIRDS" for that customer
- **THEN** the profile holds "ja_JP" and "BIRDS" and the MyList and banner preferences remain on unless also changed

### Requirement: Account status values

ID: SWHR2-R-0012
Recovered from: CUST-BR-0005
The system SHALL record an account status taking one of the values "active" or "disabled". A newly created account MUST have the status "active".

#### Scenario: Status of a new account

ID: SWHR2-R-0012.01

- **GIVEN** no customer exists for the user id "j2ee"
- **WHEN** a customer and its account are created for "j2ee"
- **THEN** the account status is "active"

#### Scenario: Account set to disabled

ID: SWHR2-R-0012.02

- **GIVEN** an account with status "active"
- **WHEN** its status is set to "disabled"
- **THEN** the account status reads "disabled"

### Requirement: Stand-alone user registration

ID: SWHR2-R-0013
Recovered from: CUST-WF-0001
The system SHALL, on a new-user submission carrying a user name and password, create the sign-on account and redirect the user onward. GIVEN account creation is refused WHEN the submission is processed THEN the system SHALL redirect to a user-creation error page.

#### Scenario: Registration accepted

ID: SWHR2-R-0013.01

- **GIVEN** no sign-on account exists for the user name "newuser"
- **WHEN** a new-user submission carrying user name "newuser" and a password is processed
- **THEN** a sign-on account for "newuser" is created and the user is redirected onward

#### Scenario: Registration refused

ID: SWHR2-R-0013.02

- **GIVEN** a sign-on account already exists for the user name "j2ee"
- **WHEN** a new-user submission carrying user name "j2ee" and a password is processed
- **THEN** no account is created and the user is redirected to the user-creation error page

### Requirement: My List panel for the favourite category

ID: SWHR2-R-0053
Recovered from: ACCT-BR-0010
WHILE a signed-on customer's MyList preference is on, the system SHALL show a "My List" panel listing up to the first 10 products of the customer's favourite category, each linking to its product page. The panel MUST NOT be shown when the preference is off.

#### Scenario: MyList preference on

ID: SWHR2-R-0053.01

- **GIVEN** a signed-on customer whose MyList preference is on and whose favourite category is "BIRDS"
- **WHEN** a storefront screen carrying the My List panel is displayed
- **THEN** the panel lists products of the "BIRDS" category, each linking to its product page

#### Scenario: Favourite category holds more than ten products

ID: SWHR2-R-0053.02

- **GIVEN** a signed-on customer whose MyList preference is on and whose favourite category holds 12 products
- **WHEN** the My List panel is displayed
- **THEN** only the first 10 products of the category are listed

#### Scenario: MyList preference off

ID: SWHR2-R-0053.03

- **GIVEN** a signed-on customer whose MyList preference is off
- **WHEN** a storefront screen is displayed
- **THEN** no My List panel is shown

### Requirement: Pet-tips banner for the favourite category

ID: SWHR2-R-0054
Recovered from: ACCT-BR-0011
WHILE a signed-on customer's banner preference is on, the system SHALL show, on the home and cart screens only, a pet-tips banner for the customer's favourite category (dogs, cats, reptiles, birds or fish), and SHALL use the dogs banner for any other category.

#### Scenario: Banner on the home screen

ID: SWHR2-R-0054.01

- **GIVEN** a signed-on customer whose banner preference is on and whose favourite category is "CATS"
- **WHEN** the home screen is displayed
- **THEN** the cats pet-tips banner is shown

#### Scenario: Unrecognised favourite category

ID: SWHR2-R-0054.02

- **GIVEN** a signed-on customer whose banner preference is on and whose favourite category is not one of dogs, cats, reptiles, birds or fish
- **WHEN** the cart screen is displayed
- **THEN** the dogs pet-tips banner is shown

#### Scenario: Screen other than home or cart

ID: SWHR2-R-0054.03

- **GIVEN** a signed-on customer whose banner preference is on
- **WHEN** a product screen is displayed
- **THEN** no pet-tips banner is shown

#### Scenario: Banner preference off

ID: SWHR2-R-0054.04

- **GIVEN** a signed-on customer whose banner preference is off
- **WHEN** the home screen is displayed
- **THEN** no pet-tips banner is shown

### Requirement: Sign-up from the sign-in screen

ID: SWHR2-R-0055
Recovered from: ACCT-REQ-0001
The system SHALL let a new visitor sign up from the sign-in screen by choosing a user name and entering a password twice. WHEN the chosen user name cannot be registered, the system SHALL show a User Creation Error screen telling the visitor the user name is in use and to choose another.

#### Scenario: User name available

ID: SWHR2-R-0055.01

- **GIVEN** no sign-on account exists for the user name "newuser"
- **WHEN** the visitor submits the sign-up form on the sign-in screen with user name "newuser" and a password entered twice
- **THEN** the user name is registered and the visitor continues to account creation

#### Scenario: User name cannot be registered

ID: SWHR2-R-0055.02

- **GIVEN** a sign-on account already exists for the user name "j2ee"
- **WHEN** the visitor submits the sign-up form with user name "j2ee"
- **THEN** the User Creation Error screen is shown, saying the user name is in use and asking the visitor to choose another

### Requirement: One customer per user id

ID: SWHR2-R-0056
Recovered from: CUST-BR-0001
WHEN a new customer is created with a user id that already has a customer, the system SHALL refuse the creation and MUST NOT create a second customer record for that user id.

#### Scenario: Duplicate user id

ID: SWHR2-R-0056.01

- **GIVEN** a customer already exists with user id "j2ee"
- **WHEN** a new customer is created with user id "j2ee"
- **THEN** the creation is refused and exactly one customer record for "j2ee" exists

### Requirement: Customer creation is all-or-nothing

ID: SWHR2-R-0057
Recovered from: CUST-BR-0009
WHEN creation of a customer's account or profile fails, the system SHALL fail the creation of the customer as a whole, so that no customer MAY exist without an account and a profile.

#### Scenario: Profile creation fails

ID: SWHR2-R-0057.01

- **GIVEN** no customer exists for the user id "newuser"
- **WHEN** a customer is created for "newuser" and creation of its profile fails
- **THEN** the customer creation fails and no customer, account or profile exists for "newuser"

#### Scenario: Account creation fails

ID: SWHR2-R-0057.02

- **GIVEN** no customer exists for the user id "newuser"
- **WHEN** a customer is created for "newuser" and creation of its account fails
- **THEN** the customer creation fails and no customer or profile exists for "newuser"

### Requirement: Customer record keyed by user id

ID: SWHR2-R-0128
Recovered from: CUST-ENT-0001
The system SHALL hold one customer record per user id, where the user id is the customer's unique identifier, and each customer SHALL own exactly one account and exactly one profile.

#### Scenario: Customer looked up by user id

ID: SWHR2-R-0128.01

- **GIVEN** a customer created for the user id "j2ee"
- **WHEN** the customer for "j2ee" is retrieved
- **THEN** exactly one customer is returned, owning one account and one profile

### Requirement: Customer profile contents

ID: SWHR2-R-0129
Recovered from: CUST-ENT-0002
The system SHALL hold, for each customer profile, a preferred language, an optional favourite category, a MyList on/off preference and a banner on/off preference. The MyList and banner preferences MUST always have a value.

#### Scenario: Profile without a favourite category

ID: SWHR2-R-0129.01

- **GIVEN** a customer profile with preferred language "en_US" and no favourite category
- **WHEN** the profile is stored
- **THEN** the profile is accepted with the favourite category empty

#### Scenario: On/off preferences always set

ID: SWHR2-R-0129.02

- **GIVEN** any stored customer profile
- **WHEN** its MyList and banner preferences are read
- **THEN** each reads either on or off and neither is empty

### Requirement: Account contents

ID: SWHR2-R-0058
Recovered from: CUST-ENT-0003
The system SHALL hold, for each account, a status, exactly one set of contact information and exactly one payment card record.

#### Scenario: Account read after creation

ID: SWHR2-R-0058.01

- **GIVEN** a customer and its account created for the user id "j2ee"
- **WHEN** the account is read
- **THEN** it carries a status, one contact-information record and one payment card record

### Requirement: Contact information snapshot

ID: SWHR2-R-0059
Recovered from: CUST-REQ-0002
The system SHALL provide a read-only snapshot of a contact-information record containing its given name, family name, telephone, e-mail and a snapshot of its postal address.

#### Scenario: Snapshot taken

ID: SWHR2-R-0059.01

- **GIVEN** a stored contact-information record for "Jane Doe" with a telephone, an e-mail and a postal address
- **WHEN** a snapshot of the record is requested
- **THEN** the snapshot carries the given name, family name, telephone, e-mail and a copy of the postal address

#### Scenario: Snapshot does not change the record

ID: SWHR2-R-0059.02

- **GIVEN** a snapshot taken of a stored contact-information record
- **WHEN** the telephone value in the snapshot is changed
- **THEN** the stored contact-information record keeps its original telephone

### Requirement: Address operations are transactional

ID: SWHR2-R-0060
Recovered from: CUST-RULE-0006
The system SHALL perform every read and update of an individual address field, every read of the whole address, and every removal of an address within a transaction, and SHALL join the caller's transaction when one exists.

#### Scenario: Update inside a failing change

ID: SWHR2-R-0060.01

- **GIVEN** a stored address and a change that updates the address city and then fails
- **WHEN** the change is rolled back
- **THEN** the address keeps its original city

#### Scenario: Update with no caller transaction

ID: SWHR2-R-0060.02

- **GIVEN** a stored address and no transaction in progress
- **WHEN** the address city is updated
- **THEN** the update runs in its own transaction and is saved

### Requirement: Account creation before purchase

ID: SWHR2-R-0061
Recovered from: CUSTOMER-ACCOUNT-WF-0001
The system SHALL let a first-time visitor create an account from the sign-in page by choosing to sign up, entering account information and submitting it, before making a purchase.

#### Scenario: First-time visitor signs up

ID: SWHR2-R-0061.01

- **GIVEN** a first-time visitor on the sign-in page
- **WHEN** the visitor chooses to sign up, enters a user name and password, then enters and submits their account information
- **THEN** an account is created for the visitor and they can go on to make a purchase
