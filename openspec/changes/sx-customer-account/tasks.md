## 1. Data model

- [ ] 1.1 Define the customer record keyed by unique user id with one-to-one account and profile
- [ ] 1.2 Define the account record with status (active, disabled), one contact record and one payment card
- [ ] 1.3 Define the profile record with preferred language, optional favourite category and mandatory MyList and banner flags
- [ ] 1.4 Define the contact-information record with given name, family name, telephone, e-mail and one owned address
- [ ] 1.5 Define the postal address record with six free-text fields and a generated key
- [ ] 1.6 Define the payment card record with number, type and month/year expiry text
- [ ] 1.7 Define the sign-on user record with unique user name and password
- [ ] 1.8 Generate and commit the schema migration for the customer-account tables

## 2. Customer lifecycle

- [ ] 2.1 Create a customer with an active account and default profile (en_US, no category, MyList on, banners on)
- [ ] 2.2 Create blank contact, address and card records for an account created from status alone
- [ ] 2.3 Attach supplied contact and card records when an account is created with them
- [ ] 2.4 Make customer creation with all dependent records a single unit of work that rolls back on any failure
- [ ] 2.5 Refuse a second customer for an existing user id
- [ ] 2.6 Cascade customer removal to account, profile, contact, address and card

## 3. Record access

- [ ] 3.1 Provide field-level update for address and contact records
- [ ] 3.2 Provide detached copies of address and contact records
- [ ] 3.3 Derive card expiry month and year from the stored month/year value with the 01/2010 fallback
- [ ] 3.4 Store address and card values without content validation

## 4. Address document exchange

- [ ] 4.1 Read address documents enforcing part order and non-empty required parts, naming the failing part
- [ ] 4.2 Write address documents omitting a blank second street line and emitting other empty parts

## 5. Sign-up

- [ ] 5.1 Build the sign-up step that registers a user name and password (password entered twice)
- [ ] 5.2 Enforce user name length of at most 25 characters and no % or \* characters
- [ ] 5.3 Enforce the maximum password length once the SME supplies its value
- [ ] 5.4 Refuse taken user names with the user-name-in-use message
- [ ] 5.5 Build the account information form with the captured fields, defaults and option lists
- [ ] 5.6 Enforce required contact fields on create and update
- [ ] 5.7 Create the customer from the submitted form, sign the visitor on and return them to the original page or home

## 6. Account screen and edit

- [ ] 6.1 Build the read-only account screen with contact, card and preference display and the edit link
- [ ] 6.2 Build the pre-filled account edit form and save every field
- [ ] 6.3 Add the browser-side empty-field check with the "<field> is empty." message
- [ ] 6.4 Store the preferred language on save and apply it from the next sign-on

## 7. Preference-driven storefront

- [ ] 7.1 Show the My List panel with up to 10 favourite-category products when MyList is on
- [ ] 7.2 Show the favourite-category pet-tips banner on home and cart pages when banners are on, falling back to dogs

## 8. Tests

- [ ] 8.1 Cover creation defaults, duplicate refusal, atomic creation and cascade removal with integration tests
- [ ] 8.2 Cover user name and password rules and the taken-name message with route tests
- [ ] 8.3 Cover address document read and write rules with unit tests
- [ ] 8.4 Cover the account screen, edit form, My List panel and banner with UI tests
- [ ] 8.5 Cover the two-step sign-up journey end to end
