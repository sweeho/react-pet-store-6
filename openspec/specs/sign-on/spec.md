# sign-on Specification

## Purpose

TBD - created by archiving change swhr2-i-0005-sign-on-and-access-control. Update Purpose after archive.

## Requirements

### Requirement: Remember the user name

ID: SWHR2-R-0119
Recovered from: SIGN-BR-0004
GIVEN the user ticks "remember my user name" when signing on, the system SHALL store the entered user name in the user's browser for 31 days (2,678,400 seconds). GIVEN the option is not ticked WHEN the user signs on, the system SHALL remove any previously remembered user name.

#### Scenario: Option ticked

ID: SWHR2-R-0119.01

- **GIVEN** the storefront sign-in screen
- **WHEN** the user signs on as "ann" with "remember my user name" ticked
- **THEN** the browser keeps "ann" as the remembered user name for 31 days

#### Scenario: Option not ticked

ID: SWHR2-R-0119.02

- **GIVEN** a browser that remembers the user name "ann"
- **WHEN** the user signs on without ticking "remember my user name"
- **THEN** the remembered user name is removed

### Requirement: Storefront idle session expiry

ID: SWHR2-R-0120
Recovered from: SIGN-BR-0006
The system SHALL end a shopping session after 15 minutes without activity, discarding its shopping cart and sign-on state.

#### Scenario: Shopper idle for 16 minutes

ID: SWHR2-R-0120.01

- **GIVEN** a signed-on shopper with items in the cart who makes no request for 16 minutes
- **WHEN** the shopper next requests a page
- **THEN** the shopper is no longer signed on and the cart is empty

### Requirement: Framework sample application idle session expiry

ID: SWHR2-R-0027
Recovered from: SIGN-BR-0012
The framework sample application SHALL end a session after 30 minutes without activity, discarding the server-side state held for that session.

#### Scenario: Visitor idle for 31 minutes

ID: SWHR2-R-0027.01

- **GIVEN** a visitor to the framework sample application who makes no request for 31 minutes
- **WHEN** the visitor next makes a request
- **THEN** a new session is started and none of the previous session's server-side state is available

### Requirement: Separate administrator and supplier areas

ID: SWHR2-R-0029
Recovered from: SIGN-ON-BR-0001
The system SHALL provide an administrator area and a supplier area as separate areas, and a user SHALL sign out of the administrator area before using the supplier area.

#### Scenario: User moves from the administrator area to the supplier area

ID: SWHR2-R-0029.01

- **GIVEN** a user who has used the administrator area
- **WHEN** the user wants to use the supplier area
- **THEN** the user signs out of the administrator area first and then signs in to the supplier area

### Requirement: Administrator signs out before using the supplier area

ID: SWHR2-R-0030
Recovered from: SIGN-ON-REQ-0001
The system SHALL require a user who is signed in to the administrator application to sign out before using the supplier application.

#### Scenario: Administrator still signed in

ID: SWHR2-R-0030.01

- **GIVEN** a user signed in to the administrator application
- **WHEN** the user opens the supplier application
- **THEN** the user MUST sign out of the administrator application before the supplier application is used

### Requirement: Message hand-off service relies on its callers for access control

ID: SWHR2-R-0121
Recovered from: SIGN-ON-BUSINESS-RULE-0001
The system SHALL NOT apply a role check of its own to the internal message hand-off service; the service SHALL run with the identity of its caller and SHALL be reachable only by in-process components, which enforce access control.

#### Scenario: Order process hands off a message

ID: SWHR2-R-0121.01

- **GIVEN** an in-process order component acting for a user
- **WHEN** it hands a message to the hand-off service
- **THEN** the message is accepted without a role check and is sent under the caller's identity

#### Scenario: Caller outside the application

ID: SWHR2-R-0121.02

- **GIVEN** a caller that is not a component of the same application
- **WHEN** it attempts to use the hand-off service
- **THEN** the service is not reachable

### Requirement: Administration sign-in screen

ID: SWHR2-R-0031
Recovered from: SIGN-REQ-0003
The administration sign-in screen SHALL ask for a User ID and a Password and SHALL offer a control that submits them. GIVEN the submitted credentials are rejected, the system SHALL show "Login Error", the text "You could not be authenticated with the information provided. Please check your Username and Password." and a link back to the sign-in page.

#### Scenario: Screen displayed

ID: SWHR2-R-0031.01

- **GIVEN** a user who is not signed in to the administration area
- **WHEN** the user requests the administration area
- **THEN** the sign-in screen is shown with a User ID field, a Password field and a submit control

#### Scenario: Rejected credentials

ID: SWHR2-R-0031.02

- **GIVEN** the administration sign-in screen
- **WHEN** the user submits a User ID and Password that do not authenticate
- **THEN** "Login Error" is shown with the text "You could not be authenticated with the information provided. Please check your Username and Password." and a link back to the sign-in page

### Requirement: Administration idle session expiry

ID: SWHR2-R-0032
Recovered from: SIGN-REQ-0004
The system SHALL expire an administration session after 54 minutes without activity.

#### Scenario: Administrator idle for 55 minutes

ID: SWHR2-R-0032.01

- **GIVEN** an administrator signed in to the administration area who makes no request for 55 minutes
- **WHEN** the administrator next requests the administration area
- **THEN** the administration sign-in screen is shown

### Requirement: Storefront sign-out

ID: SWHR2-R-0148
Recovered from: SIGN-REQ-0005
WHEN a signed-on user signs out, the system SHALL end the session, discarding the shopping cart and the sign-on state, SHALL keep the user's current language for the new session, and SHALL show a "You are signed out" screen with a link to sign in again.

#### Scenario: Shopper signs out with items in the cart

ID: SWHR2-R-0148.01

- **GIVEN** a signed-on shopper browsing in Japanese with two items in the cart
- **WHEN** the shopper signs out
- **THEN** the "You are signed out" screen is shown with a link to sign in again, the shopper is no longer signed on, the cart is empty and the store is still in Japanese

### Requirement: Pages that require a signed-on customer

ID: SWHR2-R-0028
Recovered from: SIGN-REQ-0011
The system SHALL require a signed-on user for editing the account, for the sign-in landing page, for placing and committing an order, and for entering or validating shipping and billing information.

#### Scenario: Visitor tries to place an order

ID: SWHR2-R-0028.01

- **GIVEN** a visitor who is not signed on
- **WHEN** the visitor attempts to place an order
- **THEN** the visitor is asked to sign in before the order is placed

#### Scenario: Visitor tries to edit the account

ID: SWHR2-R-0028.02

- **GIVEN** a visitor who is not signed on
- **WHEN** the visitor attempts to edit an account
- **THEN** the visitor is asked to sign in before the account can be edited

#### Scenario: Signed-on customer enters shipping information

ID: SWHR2-R-0028.03

- **GIVEN** a signed-on customer
- **WHEN** the customer enters shipping and billing information
- **THEN** the information is accepted without a further sign-in prompt

### Requirement: Storefront page header

ID: SWHR2-R-0122
Recovered from: SIGN-SCR-0007
Every storefront page SHALL show a header with a link to the main page, a keyword search box, an Account link and a Cart link. The header SHALL show a "Sign out" link when the user is signed on and a "Sign in" link otherwise.

#### Scenario: Visitor not signed on

ID: SWHR2-R-0122.01

- **GIVEN** a visitor who is not signed on
- **WHEN** any storefront page is displayed
- **THEN** the header shows the main-page link, the search box, Account, Cart and "Sign in", and no "Sign out"

#### Scenario: Signed-on customer

ID: SWHR2-R-0122.02

- **GIVEN** a signed-on customer
- **WHEN** any storefront page is displayed
- **THEN** the header shows the main-page link, the search box, Account, Cart and "Sign out", and no "Sign in"

### Requirement: Administration landing page

ID: SWHR2-R-0123
Recovered from: SIGN-SCR-0008
The system SHALL show a signed-in administrator an administration landing page that explains the administrator can view sales, revenue and orders by status and can approve or deny pending orders, and that offers two actions: launch the administration tool, and log out. A GET request to the administration entry point SHALL show this page.

#### Scenario: Administrator opens the administration area

ID: SWHR2-R-0123.01

- **GIVEN** an administrator signed in to the administration area
- **WHEN** the administration entry point is requested with a GET
- **THEN** the landing page shows the description of the sales, revenue, order-status and approve/deny facilities, a control to launch the administration tool and a control to log out

### Requirement: Order line data relies on order processes for access control

ID: SWHR2-R-0124
Recovered from: sign-on-BR-0001
The system SHALL NOT apply a role check when order line data is read, created or updated; access control SHALL come from the order process that calls it.

#### Scenario: Order process reads order lines

ID: SWHR2-R-0124.01

- **GIVEN** an order process acting for a user
- **WHEN** it reads, creates or updates order line data
- **THEN** the operation proceeds without a role check of its own
