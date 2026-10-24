## ADDED Requirements

### Requirement: Sign-on credential record

The system SHALL keep exactly one sign-on credential per user, made of a user ID and a password. The user ID MUST be the credential's identity, so that no two credentials can share a user ID.

#### Scenario: Second credential with an existing user ID

- **GIVEN** a credential exists for user ID "j2ee"
- **WHEN** a credential is created for user ID "j2ee" again
- **THEN** the creation is refused and the existing credential is unchanged

### Requirement: Credential check

The system SHALL authenticate a sign-on attempt only when a credential exists for exactly the supplied user ID and the supplied password is exactly equal, including letter case, to the stored password. The attempt MUST fail when no credential exists for the user ID.

#### Scenario: Correct user ID and password

- **GIVEN** a credential for user ID "j2ee" with password "j2ee"
- **WHEN** a sign-on is attempted with user ID "j2ee" and password "j2ee"
- **THEN** the attempt is authenticated

#### Scenario: Password differs only in letter case

- **GIVEN** a credential for user ID "j2ee" with password "j2ee"
- **WHEN** a sign-on is attempted with user ID "j2ee" and password "J2EE"
- **THEN** the attempt fails

#### Scenario: Unknown user ID

- **GIVEN** no credential exists for user ID "nobody"
- **WHEN** a sign-on is attempted with user ID "nobody" and any password
- **THEN** the attempt fails

### Requirement: User ID maximum length

The system SHALL refuse to create a credential whose user ID is longer than 25 characters, with the message "User ID cant be more than 25 chars long".

#### Scenario: 26-character user ID

- **GIVEN** a user ID of 26 characters
- **WHEN** a credential is created with it
- **THEN** the creation is refused and no credential is stored

#### Scenario: 25-character user ID

- **GIVEN** a user ID of exactly 25 characters and no existing credential for it
- **WHEN** a credential is created with it
- **THEN** the credential is stored

### Requirement: User ID forbidden characters

The system SHALL refuse to create a credential whose user ID contains a "%" or a "_" character, with the message "User Id cannot have '%' or '_' characters".

#### Scenario: User ID containing an asterisk

- **GIVEN** the user ID "ann\*lee"
- **WHEN** a credential is created with it
- **THEN** the creation is refused and no credential is stored

### Requirement: Password maximum length

The system SHALL refuse to create a credential whose password is longer than a maximum password length. The value of that maximum is not readable in the legacy source and MUST be supplied by a subject-matter expert before this requirement is approved.

#### Scenario: Password over the maximum

- **GIVEN** a password one character longer than the maximum password length
- **WHEN** a credential is created with it
- **THEN** the creation is refused and no credential is stored

### Requirement: Storefront protected pages

The storefront SHALL require a signed-on user for the account view, the account update action, the order information entry screen and the sign-in welcome page. GIVEN a visitor who is not signed on requests one of these, the system MUST remember the requested page and show the sign-in screen instead. Every other storefront page and action, including catalog browsing and the cart, SHALL be served without sign-on. A protected page SHALL be matched by its exact path within the application; the query string is not part of the match and is not remembered.

#### Scenario: Visitor opens the account page

- **GIVEN** a visitor who is not signed on
- **WHEN** the visitor requests the account view
- **THEN** the sign-in screen is shown and the account view is remembered as the page to return to

#### Scenario: Visitor opens the cart

- **GIVEN** a visitor who is not signed on
- **WHEN** the visitor requests the cart
- **THEN** the cart is shown without asking the visitor to sign in

#### Scenario: Signed-on customer opens the account page

- **GIVEN** a signed-on customer
- **WHEN** the customer requests the account view
- **THEN** the account view is shown

### Requirement: Storefront protection does not check roles

The storefront SHALL let any signed-on user open every protected storefront page; it SHALL NOT check whether the user holds a particular role for that page, even where a role is configured for it.

#### Scenario: Role configured on a protected page

- **GIVEN** a protected storefront page configured with a role, and a signed-on customer who does not hold that role
- **WHEN** the customer requests the page
- **THEN** the page is shown

### Requirement: Protected page configuration

The system SHALL read the sign-in page, the sign-in error page and the list of protected pages (each with a name, a path and optional roles) from per-application configuration when the application starts. GIVEN two protected pages share a name, the system MUST use only the first and SHALL log a warning. A change to the configuration SHALL take effect only after the application restarts.

#### Scenario: Duplicate protected page name

- **GIVEN** a configuration listing two protected pages both named "Customer Screen", the first with path "customer.screen" and the second with path "cart.do"
- **WHEN** the application starts
- **THEN** "customer.screen" is protected, "cart.do" is not, and a warning is logged

### Requirement: Storefront sign-on submission

The system SHALL check the user ID and password submitted from the storefront sign-in screen. GIVEN they authenticate, the system MUST record the user ID and a signed-on state in the visitor's session and SHALL redirect to the page the visitor originally requested. GIVEN they do not authenticate, the system MUST leave the visitor not signed on and SHALL redirect to the sign-in error screen.

#### Scenario: Successful sign-on after requesting checkout

- **GIVEN** a visitor who requested the order information entry screen and was shown the sign-in screen
- **WHEN** the visitor submits a valid user ID and password
- **THEN** the visitor is signed on and taken to the order information entry screen

#### Scenario: Failed sign-on

- **GIVEN** the storefront sign-in screen
- **WHEN** the visitor submits a user ID and password that do not authenticate
- **THEN** the visitor remains not signed on and the sign-in error screen is shown

### Requirement: Remember the user name

GIVEN the visitor ticks "Remember My User Name" when submitting the storefront sign-in screen, the system SHALL store the entered user ID in the visitor's browser for 31 days (2,678,400 seconds). GIVEN the option is not ticked, the system SHALL remove any previously remembered user ID. This SHALL happen on every submission, whether or not the credentials authenticate.

#### Scenario: Option ticked

- **GIVEN** the storefront sign-in screen
- **WHEN** the visitor submits user ID "ann" with "Remember My User Name" ticked
- **THEN** the browser keeps "ann" as the remembered user ID for 31 days

#### Scenario: Option not ticked

- **GIVEN** a browser that remembers user ID "ann"
- **WHEN** the visitor submits the sign-in screen without ticking "Remember My User Name"
- **THEN** the remembered user ID is removed

### Requirement: Storefront sign-in screen

The storefront sign-in screen SHALL be titled "Sign In" and SHALL show two forms side by side. The returning-customer form, headed "Are you a returning customer?" / "Yes.", MUST accept a User Name and a Password, MUST offer a "Remember My User Name" checkbox and a "Sign In" control that submits the credentials. The new-customer form, headed "No. I would like to sign up for an account.", MUST accept a User Name, a Password and a Password (Repeat), and MUST offer a "Create New Account" control. GIVEN the browser remembers a user ID, the returning-customer User Name SHALL be pre-filled with it, the Password SHALL be empty and the checkbox SHALL be ticked; otherwise the User Name and Password are pre-filled with the demo account "j2ee" / "j2ee". The screen SHOULD alert the visitor, before submitting, to any empty field. GIVEN a submitted sign-in fails, the system SHALL show a "Sign-in Error" screen stating that the user name and password entered were not found in the records and asking the visitor to try again.

#### Scenario: No remembered user ID

- **GIVEN** a browser that remembers no user ID
- **WHEN** the sign-in screen is displayed
- **THEN** the returning-customer form shows User Name "j2ee", a filled Password, and an unticked "Remember My User Name" checkbox, and the new-customer form shows three empty fields and a "Create New Account" control

#### Scenario: Remembered user ID

- **GIVEN** a browser that remembers user ID "ann"
- **WHEN** the sign-in screen is displayed
- **THEN** the returning-customer User Name shows "ann", the Password is empty and "Remember My User Name" is ticked

#### Scenario: Rejected credentials

- **GIVEN** the sign-in screen
- **WHEN** the visitor signs in with a user name and password that are not found
- **THEN** the "Sign-in Error" screen is shown with the "not found in our records" message and an invitation to try again

### Requirement: Storefront header sign-in state

Every storefront page SHALL show a header carrying a link to the main page, a keyword search box with a Search control, an Account link and a Cart link. The header MUST show a "Sign out" link when the visitor is signed on and a "Sign in" link otherwise. The "Sign in" link SHALL lead to the sign-in welcome page, so that the sign-in screen is shown and a successful sign-on returns to that welcome page.

#### Scenario: Visitor not signed on

- **GIVEN** a visitor who is not signed on
- **WHEN** any storefront page is displayed
- **THEN** the header shows search, Account, Cart and "Sign in", and no "Sign out"

#### Scenario: Signed-on customer

- **GIVEN** a signed-on customer
- **WHEN** any storefront page is displayed
- **THEN** the header shows search, Account, Cart and "Sign out", and no "Sign in"

### Requirement: Session set-up after sign-on

WHEN a user signs on to the storefront, the system SHALL associate the shopping session with that user, SHALL load the user's customer record into the session, and SHALL switch the session's language and the shopping cart's locale to the customer's preferred language. GIVEN no customer record exists yet for the user, sign-on MUST still succeed.

#### Scenario: Customer who prefers Japanese

- **GIVEN** a customer whose preferred language is Japanese, browsing the store in English
- **WHEN** the customer signs on
- **THEN** the store and the cart switch to Japanese

#### Scenario: User without a customer record

- **GIVEN** a user who has a credential but no customer record yet
- **WHEN** the user signs on
- **THEN** sign-on succeeds and no customer record is loaded

### Requirement: Storefront sign-out

WHEN a signed-on user chooses "Sign out", the system SHALL end the session, discarding the shopping cart and the signed-on state, SHALL start a new session that keeps the language the user was using, and SHALL show a screen titled "You are signed out." that thanks the user for shopping and offers a link to sign in again.

#### Scenario: Customer signs out with items in the cart

- **GIVEN** a signed-on customer browsing in Japanese with two items in the cart
- **WHEN** the customer chooses "Sign out"
- **THEN** the signed-out screen is shown, the customer is no longer signed on, the cart is empty and the store is still in Japanese

### Requirement: Storefront idle session expiry

The system SHALL end a storefront session after 15 minutes without a request, discarding its cart and signed-on state.

#### Scenario: Customer idle for 16 minutes

- **GIVEN** a signed-on customer with items in the cart who makes no request for 16 minutes
- **WHEN** the customer next requests the account view
- **THEN** the customer is not signed on, the sign-in screen is shown and the cart is empty

### Requirement: Error screen selection

WHEN processing a storefront request fails with an error, the system SHALL show the error screen configured for that kind of error or for the nearest more general kind it belongs to. GIVEN no error screen is configured for it, the request MUST fail with a generic server error.

#### Scenario: Mapped error

- **GIVEN** an error screen configured for a general kind of failure
- **WHEN** a request fails with a more specific failure of that kind
- **THEN** the configured error screen is shown

#### Scenario: Unmapped error

- **GIVEN** no error screen configured for a failure or any of its general kinds
- **WHEN** a request fails with it
- **THEN** a generic server error is returned

### Requirement: Server error page

GIVEN an unexpected server error, the system SHALL show a Server Error page that displays the error message and asks the user to notify the administrator. The page SHOULD NOT show the technical stack trace to the user.

#### Scenario: Unexpected error

- **GIVEN** a request that fails with an unexpected server error
- **WHEN** the error page is shown
- **THEN** it displays the error message and a request to notify the administrator

### Requirement: Administration area access

The system SHALL restrict the administration area, for both page requests and form submissions, to authenticated users holding the administrator role. GIVEN a user who is not authenticated requests the area, the system MUST show the administration sign-in screen first.

#### Scenario: Unauthenticated request

- **GIVEN** a user who is not signed in to the administration area
- **WHEN** the user requests the administration area
- **THEN** the administration sign-in screen is shown

#### Scenario: Authenticated user without the role

- **GIVEN** a user authenticated with a credential that does not hold the administrator role
- **WHEN** the user requests the administration area
- **THEN** access is refused

### Requirement: Built-in administrator account

The system SHALL be provisioned at installation with an administrator account, user ID "jps_admin", that holds the administrator role. The administrator role SHALL also be granted to members of the group "administrator_group".

#### Scenario: Fresh installation

- **GIVEN** a freshly installed system
- **WHEN** "jps_admin" signs in to the administration area with the installed password
- **THEN** the administration landing page is shown

### Requirement: Administration sign-in screen

The administration sign-in screen SHALL be headed "Please sign into Java Pet Store Admin Module", MUST accept a User ID and a Password, and MUST offer a control that submits them. GIVEN the credentials are rejected, the system SHALL show a "Login Error" page with the text "You could not be authenticated with the information provided. Please check your Username and Password." and a "Return to Sign in Page" link back to the administration area.

#### Scenario: Screen displayed

- **GIVEN** a user who is not signed in to the administration area
- **WHEN** the administration sign-in screen is displayed
- **THEN** it shows a User ID field, a Password field and a submit control

#### Scenario: Rejected credentials

- **GIVEN** the administration sign-in screen
- **WHEN** the user submits a wrong password for "jps_admin"
- **THEN** the "Login Error" page is shown with the authentication message and a "Return to Sign in Page" link

### Requirement: Administration landing page

A GET request to the administration area by a signed-in administrator SHALL show the administration landing page. The page MUST state that the administrator can view sales, revenue and orders with a specified state, and can approve or deny pending orders. It MUST offer a "Launch Rich Client" control that starts the administration application and a "logout" control that signs the administrator out.

#### Scenario: Administrator opens the area

- **GIVEN** an administrator signed in to the administration area
- **WHEN** the administration area is requested
- **THEN** the landing page shows the description of the sales, revenue, order and approve/deny facilities, a "Launch Rich Client" control and a "logout" control

### Requirement: Administration application launch

WHEN a signed-in administrator chooses "Launch Rich Client", the system SHALL return a launch descriptor that starts the administration application against the same server host and port and binds it to the administrator's current session, so that the application needs no separate sign-in. GIVEN a submission to the administration area carries no recognised action, the system SHALL return an empty response.

#### Scenario: Launch from the landing page

- **GIVEN** an administrator on the administration landing page
- **WHEN** the administrator chooses "Launch Rich Client"
- **THEN** the administration application starts and its data requests run within the administrator's session without asking for credentials

### Requirement: Administration data requests need a live session

The administration data service SHALL refuse a request that carries no existing session, replying with the error "Session Timed Out; Please exit and login as admin from the login page" and processing nothing. GIVEN an existing session is present, the legacy system processes the request without checking the caller's role; the system MUST additionally require the administrator role before processing it.

#### Scenario: Expired session

- **GIVEN** the administration application whose session has expired
- **WHEN** it requests the list of pending orders
- **THEN** the reply is "Session Timed Out; Please exit and login as admin from the login page" and no orders are returned

#### Scenario: Session without the administrator role

- **GIVEN** a request carrying a live session that belongs to a user without the administrator role
- **WHEN** it asks for the order list
- **THEN** the request is refused

### Requirement: Administration logout

WHEN a signed-in administrator chooses "logout" on the landing page, the system SHALL end the administrator's session and show the administration welcome page with a "Click here to enter Admin" link back to the administration area. Quitting the administration application alone SHALL NOT end the session.

#### Scenario: Administrator logs out

- **GIVEN** an administrator on the administration landing page
- **WHEN** the administrator chooses "logout"
- **THEN** the session ends and the welcome page with the "Click here to enter Admin" link is shown, and requesting the administration area again shows the sign-in screen

### Requirement: Administration idle session expiry

The system SHALL end an administration session after 54 minutes without a request.

#### Scenario: Administrator idle for 55 minutes

- **GIVEN** an administrator signed in to the administration area who makes no request for 55 minutes
- **WHEN** the administrator next requests the administration area
- **THEN** the administration sign-in screen is shown

### Requirement: Supplier area access

The system SHALL restrict every request to the supplier inventory area (home, inventory display, inventory update and logout) to authenticated users holding the supplier area's protected role. GIVEN a user who is not authenticated requests the area, the system MUST show the supplier sign-in screen first. The legacy system requires no transport encryption for this area.

#### Scenario: Unauthenticated request

- **GIVEN** a user who is not signed in to the supplier area
- **WHEN** the user requests the inventory display
- **THEN** the supplier sign-in screen is shown

### Requirement: Built-in supplier account

The system SHALL be provisioned at installation with a supplier account, user ID "supplier", that holds the supplier area's protected role. That role SHALL also be granted to members of the group "administrator_group".

#### Scenario: Fresh installation

- **GIVEN** a freshly installed system
- **WHEN** "supplier" signs in to the supplier area with the installed password
- **THEN** the supplier home page is shown

### Requirement: Supplier sign-in screen

The supplier sign-in screen SHALL be headed "Please sign into Java Pet Store Supplier Module", MUST accept a User ID and a Password, and MUST offer a control that submits them. GIVEN the credentials are rejected, the system SHALL show a "Login Error" page with the text "You could not be authenticated with the information provided. Please check your Username and Password." and a "Return to Sign in Page" link back to the supplier area.

#### Scenario: Screen displayed

- **GIVEN** a user who is not signed in to the supplier area
- **WHEN** the supplier sign-in screen is displayed
- **THEN** it shows a User ID field, a Password field and a submit control

#### Scenario: Rejected credentials

- **GIVEN** the supplier sign-in screen
- **WHEN** the user submits a wrong password for "supplier"
- **THEN** the "Login Error" page is shown with the authentication message and a "Return to Sign in Page" link

### Requirement: Supplier logout

WHEN a signed-in supplier chooses Logout, the system SHALL end the session and show the "Java Pet Store - Supplier Home Page" with a "Click here to enter Supplier" link back to the supplier area.

#### Scenario: Supplier logs out

- **GIVEN** a supplier signed in to the supplier area
- **WHEN** the supplier chooses Logout
- **THEN** the session ends and the page with the "Click here to enter Supplier" link is shown

### Requirement: Supplier idle session expiry

The system SHALL end a supplier session after 54 minutes without a request.

#### Scenario: Supplier idle for 55 minutes

- **GIVEN** a supplier signed in to the supplier area who makes no request for 55 minutes
- **WHEN** the supplier next requests the inventory display
- **THEN** the supplier sign-in screen is shown

### Requirement: Anonymous catalog access

The system SHALL allow catalog browsing, lookup and search without the user being signed on or holding any role.

#### Scenario: Visitor searches the catalog

- **GIVEN** a visitor who is not signed on
- **WHEN** the visitor searches the catalog for "dog"
- **THEN** the matching products are shown without a sign-in prompt

### Requirement: Access control at the entry points

Internal data and back-office services (customer, account, profile, contact, address and payment card records; purchase orders and their lines; supplier orders; order workflow status; the message hand-off service; the order processing administration services) SHALL NOT apply a role check of their own and SHALL run under the identity of their caller. Access control for them MUST be enforced by the user-facing entry point that calls them: the storefront protected pages, the administration area or the supplier area. None of these services SHALL be reachable by a user except through such an entry point.

#### Scenario: Stored card read through the account view

- **GIVEN** a visitor who is not signed on
- **WHEN** the visitor attempts to read stored payment card details
- **THEN** the only route is through a protected storefront page, so the sign-in screen is shown and no card data is returned

#### Scenario: Order processing administration called directly

- **GIVEN** a caller outside the administration area
- **WHEN** it attempts to call the order processing order-list service directly
- **THEN** the call is not reachable and no order data is returned
