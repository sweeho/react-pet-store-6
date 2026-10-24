## ADDED Requirements

### Requirement: Password entered twice at sign-up

ID: SWHR2-R-0009
Recovered from: ACCT-BR-0003
The system SHALL collect a repeated password when a new user name is registered. The system MUST check that each of the two password fields is not empty before the registration is submitted; no check that the two passwords match is made.

#### Scenario: Both password fields filled with the same value

- **GIVEN** a visitor registering the user name "j2ee"
- **WHEN** the visitor enters the same non-empty password in both password fields and submits
- **THEN** the registration proceeds with that user name and the first password

#### Scenario: A password field left empty

- **GIVEN** a visitor registering a new user name
- **WHEN** the visitor leaves the repeated password field empty and submits
- **THEN** the submission is refused before it reaches the server and the empty field is reported

#### Scenario: The two passwords differ

- **GIVEN** a visitor registering a new user name
- **WHEN** the visitor enters two different non-empty passwords and submits
- **THEN** the registration proceeds using the first password and no mismatch is reported

### Requirement: Payment card type and expiry year options

ID: SWHR2-R-0010
Recovered from: ACCT-RULE-0009
The system SHALL offer the payment card types Java(TM) Card, Duke Express and Meow Card, and SHALL offer card expiry years only from a fixed list.

#### Scenario: Card type choices on the account form

- **GIVEN** a customer filling in the account information form
- **WHEN** the customer opens the card type choice
- **THEN** exactly the options Java(TM) Card, Duke Express and Meow Card are offered

#### Scenario: Expiry year choices on the account form

- **GIVEN** a customer filling in the account information form
- **WHEN** the customer opens the card expiry year choice
- **THEN** only years from the fixed list are offered and no free-text year can be entered

### Requirement: Customer profile defaults at creation

ID: SWHR2-R-0011
Recovered from: CUST-BR-0003
WHEN a customer profile is created at customer creation THEN the system SHALL set the preferred language to "en_US", leave the favourite category unset, turn the MyList preference on, and turn the banner preference on.

#### Scenario: New customer created without profile choices

- **GIVEN** no customer exists for the user id "j2ee"
- **WHEN** a customer is created for "j2ee" and no profile values are supplied
- **THEN** the customer's profile has preferred language "en_US", no favourite category, the MyList preference on and the banner preference on

#### Scenario: Profile values supplied after creation

- **GIVEN** a customer just created with the default profile
- **WHEN** the creating flow then stores the preferred language "ja_JP" and favourite category "BIRDS" for that customer
- **THEN** the profile holds "ja_JP" and "BIRDS" and the MyList and banner preferences remain on unless also changed

### Requirement: Account status values

ID: SWHR2-R-0012
Recovered from: CUST-BR-0005
The system SHALL record an account status taking one of the values "active" or "disabled". A newly created account MUST have the status "active".

#### Scenario: Status of a new account

- **GIVEN** no customer exists for the user id "j2ee"
- **WHEN** a customer and its account are created for "j2ee"
- **THEN** the account status is "active"

#### Scenario: Account set to disabled

- **GIVEN** an account with status "active"
- **WHEN** its status is set to "disabled"
- **THEN** the account status reads "disabled"

### Requirement: Stand-alone user registration

ID: SWHR2-R-0013
Recovered from: CUST-WF-0001
The system SHALL, on a new-user submission carrying a user name and password, create the sign-on account and redirect the user onward. GIVEN account creation is refused WHEN the submission is processed THEN the system SHALL redirect to a user-creation error page.

#### Scenario: Registration accepted

- **GIVEN** no sign-on account exists for the user name "newuser"
- **WHEN** a new-user submission carrying user name "newuser" and a password is processed
- **THEN** a sign-on account for "newuser" is created and the user is redirected onward

#### Scenario: Registration refused

- **GIVEN** a sign-on account already exists for the user name "j2ee"
- **WHEN** a new-user submission carrying user name "j2ee" and a password is processed
- **THEN** no account is created and the user is redirected to the user-creation error page
