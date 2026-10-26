## 1. Storefront sign-on

- [ ] 1.1 Require a signed-on user for account editing, the sign-in landing page, order placement and commit, and shipping and billing entry and validation
- [ ] 1.2 Write or clear the remembered user name for 31 days on each sign-on according to the "remember my user name" option
- [ ] 1.3 Implement sign-out that ends the session, empties the cart and sign-on state, and keeps the current language in the new session
- [ ] 1.4 Build the "You are signed out" screen with the link to sign in again
- [ ] 1.5 Expire idle storefront sessions after 15 minutes, discarding the cart and sign-on state

## 2. Storefront header

- [ ] 2.1 Build the header with the main-page link, keyword search box, Account and Cart links
- [ ] 2.2 Show "Sign out" in the header for a signed-on user and "Sign in" otherwise

## 3. Framework sample application

- [ ] 3.1 Expire idle framework sample application sessions after 30 minutes, discarding their server-side state

## 4. Administration area

- [ ] 4.1 Build the administration sign-in screen with User ID, Password and submit control
- [ ] 4.2 Show the "Login Error" page with the authentication message and the link back to sign-in on rejected credentials
- [ ] 4.3 Build the administration landing page with the facility description and the launch-tool and log-out controls, served on GET to the entry point
- [ ] 4.4 Expire idle administration sessions after 54 minutes

## 5. Administrator and supplier separation

- [ ] 5.1 Keep the administrator area and the supplier area separate
- [ ] 5.2 Require a user signed in to the administrator application to sign out before using the supplier application

## 6. Internal service access control

- [ ] 6.1 Run the message hand-off service under its caller's identity with no role check, reachable only from in-process components
- [ ] 6.2 Run order line read, create and update with no role check, leaving access control to the calling order process

## 7. Verification

- [ ] 7.1 Integration-test the sign-in requirement on account editing and checkout steps
- [ ] 7.2 Integration-test the remembered user name cookie with the option ticked and unticked
- [ ] 7.3 Integration-test sign-out and the 15-, 30- and 54-minute idle expiries
- [ ] 7.4 UI-test the storefront header in both sign-in states and the signed-out screen
- [ ] 7.5 UI-test the administration sign-in screen, its Login Error page and the landing page
- [ ] 7.6 E2E-test administrator sign-out before supplier use
