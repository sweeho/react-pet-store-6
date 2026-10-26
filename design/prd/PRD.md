## Summary

Pet Store Modernisation replaces the legacy Java Pet Store 1.3.2 with a rebuilt store that behaves as its approved specification says. The specification was extracted from the legacy system, reviewed, and approved on initiative SWHR2-N-0001. Shoppers browse a localized pet catalog in US English, Japanese or Simplified Chinese. They search it, keep a session-only cart, sign up and sign on, and place orders. Administrators approve or deny orders that are not auto-approved and view orders and sales charts. A supplier maintains stock. Order processing moves each approved order through fulfilment, invoicing and customer e-mail notifications. A seeded sample data set gives the store its initial catalog, customers and inventory.

## Context

The legacy system is four cooperating applications: a storefront, an order processing centre, a supplier application, and a rich-client administration tool. They exchange orders, approvals and invoices over asynchronous messaging. Its rules are spread across many modules and are written down almost nowhere outside the code. Spec extraction SX-0001 recovered those rules as one specification per capability under `openspec/changes/`, and every requirement in them now carries an approved `ID:` key. That specification is the record of what the replacement must do. Where it keeps a behaviour that looks like a legacy defect, the behaviour is built as specified until the Business Owner decides otherwise.

The replacement is a single Vite React SPA with a Nitro (H3) server in one repository, backed by SQLite through Drizzle. The legacy four-application structure, its three databases and its message broker are not reproduced. Only the behaviour the specification states is carried over.

## Goals

- Shoppers can browse the catalog by category, product and item, and search it by keyword, in en_US, ja_JP or zh_CN. Each shopper sees only the catalog content and prices held for their current locale.
- Shoppers can switch language from the page header at any time. The cart follows the new locale, and text in Japanese or Chinese is accepted without corruption, including at sign-on.
- Visitors can add items to a session-only cart without signing on. Signing on is required to edit an account and to check out.
- Visitors can sign up from the sign-in screen and create an account with contact, card and profile preferences. The My List panel and the pet-tips banner follow those preferences.
- Signed-on customers can check out with a billing and shipping form pre-filled from their account. They receive an order id from the shared "1001" counter, and their cart is emptied once the order is placed.
- Orders are handed to order processing asynchronously and start PENDING. Small orders are auto-approved: en_US totals under 500 and ja_JP totals under 50000. Every other order waits for an administrator.
- Administrators can review pending orders and approve or deny them in a batch that is committed together. They can view non-pending orders and revenue and order-count charts over a date range.
- The supplier can view inventory and update the quantity of the rows it marks, in one submission.
- Approved orders are fulfilled from supplier stock, possibly in more than one shipment. Each shipment is invoiced, and the order completes only when fully shipped. A restock re-examines orders that are still waiting.
- Customers are e-mailed when an order is approved, as parts ship, and when it completes. Each notification is switched on or off independently at deployment.
- A fresh installation is seeded from one editable UTF-8 sample data set: four users, five categories, sixteen products, twenty-eight items in three locales, and supplier stock of 10000 for EST-1 to EST-29.

## Non-goals

- Reproducing the legacy architecture: separate J2EE applications, EJBs, JMS queues and topics, a Java Web Start admin client, or JSP page templates.
- Real payment authorisation. The legacy system captures card details without charging them.
- Persisting a cart across sessions. The cart is session-only.
- Maintaining catalog content through an admin interface. The catalog is only seeded.
- Translating catalog content or authoring page sets for languages beyond en_US, ja_JP and zh_CN.
- Export or scheduled delivery of reports.
- Importing production or customer data.
- Any user interface for order fulfilment, customer notifications or data population. None of these has a screen in the specification.

## Users

- **Visitor**: browses, searches, switches language and uses the cart without signing on.
- **Customer**: a signed-on visitor who owns one account and one profile, edits them, and places orders. Their session ends after 15 minutes idle.
- **Administrator**: signs in to the administration area, approves or denies pending orders, and views order lists and sales charts. Their session expires after 54 minutes idle. They must sign out of the administration area before using the supplier area.
- **Supplier**: signs in to the supplier area and maintains inventory quantities that drive fulfilment.
- **Operator**: deploys the system, switches each customer notification on or off, configures the mail server, sender and account, and edits the seed data set.

## User journeys

Browse and buy as a returning customer:

1. Home screen
2. Category product list
3. Product item list
4. Item detail
5. Shopping cart
6. Sign-in
7. Billing and shipping information

Find an item by keyword:

1. Home screen
2. Search results
3. Item detail
4. Shopping cart

Sign up before a first purchase:

1. Sign-in
2. Account information
3. Home screen

Sign up with a user name already in use:

1. Sign-in
2. User Creation Error
3. Sign-in

Change language:

1. Home screen (header language switch)
2. Home screen in the new locale

Change language from the dedicated screen:

1. Change-language screen
2. Change-language confirmation

Edit the account and preferences:

1. Sign-in
2. Account information
3. Home screen (My List panel and pet-tips banner per preference)

Sign out:

1. Any storefront screen (header Sign out)
2. Signed out

Approve or deny pending orders:

1. Administration sign-in
2. Administration landing page
3. Pending orders
4. Non-pending orders

Review sales:

1. Administration sign-in
2. Administration landing page
3. Sales pie chart
4. Sales bar chart

Update supplier stock:

1. Supplier sign-in
2. Supplier home
3. Supplier inventory

## Capability map

- site-shell: landing page at the root route, global navigation, shared layout and shared empty, error and loading frames (added; not in the manifest, see Open questions)
- localization: en_US, ja_JP and zh_CN storefront locales with en_US as the default, header language switch, page locale fallback, locale-aware formatting and UTF-8 input
- catalog-browsing: localized three-level catalog with category and product paging, item detail, keyword search and a shared five-minute page cache
- sign-on: storefront, administration and supplier sign-on, protected pages, remembered user name, sign-out and idle session expiry
- customer-account: sign-up, one customer per user id with an account and profile, and the My List and pet-tips banner preferences
- shopping-cart: one session-only cart per browsing session with add, remove, quantity update and total
- checkout: pre-filled billing and shipping form, order ids from the "1001" counter, atomic order creation and asynchronous hand-off to order processing
- order-approval: locale-based auto-approval thresholds and administrator batch approval or denial of pending orders
- supplier-inventory: one stock record per item and a batch update of the inventory rows the supplier marks
- order-fulfillment: order lifecycle from PENDING to COMPLETED, supplier orders, shipment, invoicing and re-fulfilment on restock
- customer-notifications: approval, shipment and completion e-mails, each switchable at deployment and delivered from a durable queue
- sales-reporting: administrator order lists by status and revenue and order-count charts over a date range
- data-population: seeding the catalog, customers, users and supplier stock from one editable UTF-8 data set at installation

## Screens

Storefront (every page carries the header with main-page link, search box, Account, Cart, Sign in or Sign out, and the language flags, plus the category side panel):

- Home screen: pet selection map linking to Birds, Fish, Dogs, Reptiles and Cats; pet-tips banner and My List panel when the customer's preferences are on.
- Category product list: the products of one category by name, two per page, with Previous and Next.
- Product item list: the items of one product, each row with Add to Cart.
- Item detail: image, "List Price", "Your Price" and Add to Cart.
- Search results: items matching any keyword, each addable to the cart.
- Shopping cart: lines with Remove, editable quantity and unit price; Update Cart, total and Check Out. Shows "Your Shopping Cart is Empty." when empty.
- Sign-in: returning-customer form with Remember My User Name, and new-customer form with the password entered twice.
- User Creation Error: the user name is in use; choose another.
- Account information: contact details, card type from Java(TM) Card, Duke Express and Meow Card, expiry from a fixed year list, and profile preferences.
- Billing and shipping information: the checkout form, pre-filled from the account.
- Signed out: "You are signed out" with a link to sign in again.
- Change-language screen: locale selector and "Change Locale", followed by a confirmation stating the new locale.
- Server Error: error message and trace, asking the user to notify the administrator.
- Empty-cart order error: shown when an order is submitted with an empty cart.

Administration:

- Administration sign-in: User ID and Password. "Login Error" with a link back on failure.
- Administration landing page: describes the facilities and offers launch the administration tool, and log out.
- Pending orders: PENDING orders with an editable status coloured yellow, green or red, and Commit and Refresh. Warns before a refresh discards uncommitted marks.
- Non-pending orders: APPROVED, DENIED and COMPLETED orders, loaded by Refresh. Both order lists show ID, user ID, date, amount and status, and sort by column.
- Sales pie chart and Sales bar chart: revenue and order counts per category over a date range that defaults to 1 January 2001 to 31 December 2002.

Supplier:

- Supplier sign-in: user id and password, with a login error on failure.
- Supplier home: Display Inventory and Logout.
- Supplier inventory: item, existing quantity, new-quantity entry and update marker per row, with a single Submit.

Shared (site-shell): landing page, global navigation, and the empty, error and loading frames.

## Constraints and assumptions

- The replacement is built on the pinned stack: a Vite React SPA with file-based pages, a Nitro (H3) server with file-based API routes, SQLite through better-sqlite3 and Drizzle, and CSS-first Tailwind. Legacy screens become SPA pages, legacy actions and the admin data service become JSON API routes, and the admin rich client becomes admin pages in the same SPA.
- Where the specification requires asynchronous, durable or retried delivery (order hand-off, approval decisions, supplier orders, invoices, notification e-mails), it is assumed to be met inside the monolith by a persisted job or outbox table rather than a separate message broker.
- Money is stored in integer minor units. Legacy rounding behaviour is honoured only where a requirement states it.
- Passwords are stored hashed. No requirement asks the replacement to keep plain-text credentials.
- Behaviours the extraction recorded as suspected legacy defects are built as specified until the Business Owner decides otherwise. Examples: the second password is not checked against the first at sign-up, re-adding an item sets its quantity to one, and denied orders count in revenue.
- Sessions are server-owned. The cart lives only for the session and is discarded on sign-out or after 15 minutes idle.
- Every administration, supplier and population route needs an explicit authorisation decision, because the specification records some legacy access gaps without endorsing them.

## Open questions

1. **Why the site-shell capability cannot be approved (operator question).** site-shell is in `openspec/changes/swhr2-i-0002-bootstrap-landing-page-and/`, but it is not one of the 12 capabilities in `build/manifest.yaml`. It has no manifest slug, order, dependency list, canvas or evidence entry, and its requirements carry no "Recovered from" extraction record, because the platform generates it rather than extraction recovering it. Anything that keys approval on the manifest has no site-shell entry to approve. I added it to the Capability map because every other capability's screens render inside it. Adding a site-shell entry to the manifest, ordered first with the other capabilities depending on it, would make the two agree. Confirm that is the intent.
2. **Why the synthesize step failed (operator question).** No failed agent run is visible in the recent run history for this project, so I cannot quote its error. The repository has two inconsistencies that would break any step that resolves capabilities through the manifest. First, every `change.dir` in `build/manifest.yaml` points to `openspec/changes/sx-<capability>`, and none of those directories exists; the changes live under `openspec/changes/swhr2-i-00NN-*`. Second, `design/prd/` did not exist before this turn. The manifest paths need correcting, and the failed run's log is needed to confirm the actual cause.
3. **Landing page versus Home screen.** site-shell asks for a landing page at the root route that links to every primary area. catalog-browsing asks for the main page to be the pet selection map. This PRD treats them as one storefront Home screen. Should administration and supplier entries appear in the storefront's global navigation, given that their users sign on separately?
4. **zh_CN and de_DE scope.** The specification ships zh_CN as a supported locale, and the change-language screen also offers German with no German page set. The PRD states zh_CN as supported and German as offered only on that screen. See divergences.
5. **Datastores.** The data-population specification requires three separate datastores (storefront, supplier, order processing) and the "/petstore" path. The rebuild guidance prescribes one SQLite database. The PRD assumes one database. See divergences.
6. **Order Placed screen.** The manifest's checkout canvas lists an Order Placed screen with the order id and a confirmation e-mail notice, but the approved checkout specification has no requirement for it. Is it in scope?
7. **Notification defaults.** The specification has every notification disabled unless enabled at deployment, while the documentation on the default is recorded as conflicting. See divergences.
8. **Stale guidance.** `architecture/rebuild-guidance.md` still says no requirement carries an `ID:` line and that the specs live under `sx-*` directories. Both are now untrue and should be refreshed.
9. **Auto-approval boundaries.** The specification never auto-approves zh_CN or other locales, and treats a total of exactly 500 as pending. These are recorded as open Business Owner decisions.

## Sources

The approved specification under `openspec/changes/swhr2-i-*/specs/*/spec.md`, the build manifest `build/manifest.yaml`, and `architecture/rebuild-guidance.md`. Per-section citations are in `design/prd/sources.yaml`. No source documents were uploaded for this initiative.
