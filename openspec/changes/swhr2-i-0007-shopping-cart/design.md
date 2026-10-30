# Shopping cart: legacy implementation notes

These notes record how Java Pet Store 1.3.2 implements the shopping cart. The visible contract of the cart screen and every behaviour is stated in `specs/shopping-cart/spec.md`. This file explains where each behaviour lives in the legacy code and what the extraction could not settle. No target design is proposed here.

## Source map

| Concern                | Legacy location                                                                                                                                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cart state             | `components/cart/.../cart/ejb/ShoppingCartLocalEJB.java`: a `HashMap` from item id to `Integer` quantity, created empty in the constructor and `ejbCreate`. Declared `Stateful` in `components/cart/src/ejb-jar.xml` (lines 47-54) |
| Cart client interface  | `components/cart/.../cart/ejb/ShoppingCartLocal.java`: `addItem(String)`, `deleteItem`, `updateItemQuantity`, `getItems`, `getCount`, `getSubTotal`, `empty`, `setLocale`                                                          |
| Cart line value object | `components/cart/.../cart/model/CartItem.java` (item id, product id, category, name, attribute, `int` quantity, `double` unit cost; `getTotalCost()` = quantity × unit cost)                                                       |
| View model             | `components/cart/.../cart/model/ShoppingCartModel.java` (`getSize()`, `getTotalCost()`)                                                                                                                                            |
| Authorisation          | `components/cart/src/ejb-jar.xml` lines 72-78: `<unchecked/>` on every method. `cart.do` is not in `signon-config.xml`'s protected list                                                                                            |
| Web request handling   | `apps/petstore/.../controller/web/actions/CartHTMLAction.java` lines 85-121: `action=purchase` → `ADD_ITEM`, `action=remove` → `DELETE_ITEM`, `action=update` → `UPDATE_ITEMS` from every `itemQuantity_<itemId>` parameter        |
| Event                  | `apps/petstore/.../controller/events/CartEvent.java` (quantity defaults to 1; javadoc states zero removes)                                                                                                                         |
| Applying the event     | `apps/petstore/.../controller/ejb/actions/CartEJBAction.java` lines 60-90, run in `ShoppingControllerEJB` (Stateful, transaction `Required`)                                                                                       |
| URL mapping            | `apps/petstore/src/docroot/WEB-INF/mappings.xml` lines 106-108: `cart.do` → `cart.screen`                                                                                                                                          |
| Cart screen            | `apps/petstore/src/docroot/cart.jsp` (plus `ja/` and `zh/` copies); screen `cart` in `screendefinitions_en_US.xml` lines 55-63                                                                                                     |
| Cart per session       | `ShoppingClientFacadeLocalEJB.getShoppingCart()` lines 132-145 creates the cart lazily, once. `PetstoreComponentManager.sessionCreated` lines 95-108 puts it in the HTTP session                                                   |
| Sign-out               | `SignOffHTMLAction.java` lines 69-82 invalidates the HTTP session and builds a new component manager, so a new, empty cart is created                                                                                              |
| Emptying after order   | `OrderEJBAction.java` line 167: `cart.empty()` after the purchase order is sent                                                                                                                                                    |
| Failure routing        | `waf/.../controller/web/MainServlet.java` lines 117-128 and `ScreenFlowManager.getExceptionScreen` lines 164-183; mappings in `apps/petstore/src/docroot/WEB-INF/mappings.xml` lines 110-112                                       |

## How the behaviours are implemented

- **Add.** Product, item and search pages link to `cart.do?action=purchase&itemId=<id>`. `CartEJBAction` calls `addItem(itemId)`, which runs `cart.put(itemId, 1)`. This overwrites an existing quantity, so adding again resets the line to 1. Petstore pass A described this as "each click adds one unit". The cart component shows that is wrong.
- **Update.** The cart page posts every quantity field to `cart.do?action=update`. `CartHTMLAction` parses each value with `new Integer(value)` and substitutes 0 on `NumberFormatException`. `updateItemQuantity` removes the key, then re-adds it only when the new quantity is greater than 0. So zero and negative values remove the line. An item id that is not in the cart is added. The text input has `maxlength="10"`, a markup-only limit, and the server has no upper bound. A value above the `int` range fails to parse and is treated as 0.
- **Remove.** Each line's Remove link calls `cart.do?action=remove&itemId=<id>` → `deleteItem` → `cart.remove`. Removing a missing id does nothing.
- **Count and empty check.** `getCount()` returns `cart.size()`, the number of lines. `cart.jsp` shows the empty message on `cart.count == 0`.
- **Lines and subtotal.** `getItems()` re-reads every line from the catalog on each call (`new CatalogHelper(false).getItem(itemId, locale)`, which goes through the catalog EJB) and builds a `CartItem` with `item.getListCost()` as unit cost. `getSubTotal()` sums `unitCost * quantity` in a Java `double` with no rounding. `ShoppingCartModel.getTotalCost()` repeats the same sum. Iteration is over `HashMap.keySet()`, so line order is undefined.
- **Locale.** The bean holds a `Locale` that defaults to `Locale.US` and changes through `setLocale`. The English `cart.jsp` forces `fmt:setLocale en_US` for currency formatting. The `ja` and `zh` copies force `ja_JP` and `zh_CN`. Currency formatting is therefore fixed by the page language, not by the cart locale.
- **Lookup failure.** `getItems()` catches `CatalogException` per line, prints it to stdout and skips the line. The map entry stays, so `getCount()` still counts it.
- **Failure routing.** `MainServlet.doProcess` catches every `Throwable`, stores it in the request attribute `javax.servlet.jsp.jspException` and asks `ScreenFlowManager` for a screen. The manager walks the `<exception-mapping>` entries and returns the first whose class is assignable from the failure (`Class.isAssignableFrom`), so a mapping for a superclass catches its subclasses. Map iteration order decides which of two matching mappings wins. An unmapped failure becomes a `ServletException`. Pet Store maps `ShoppingCartEmptyOrderException` to `cart_empty_order_error.screen`, `DuplicateAccountException` to `duplicate_account.screen` and `GeneralFailureException` to `error.screen`. The mechanism is cross-cutting; it is filed under the cart because the empty-cart order rule depends on it.
- **Add with quantity.** `ShoppingCartLocalEJB.addItem(String, int)` (lines 115-117) runs `cart.put(itemID, qty)` with no check on `qty`. It is not declared on `ShoppingCartLocal` and has no container-transaction entry, and no caller was found.
- **Persistence.** None. There is no entity bean, DAO or table for the cart. `ejbPassivate`, `ejbActivate` and `ejbRemove` are empty. The home's `create(HashMap startingCart)` is commented out.

## Suspected legacy defects (Business Owner decision, defect register)

- **D1 Re-add resets quantity.** Adding an item already in the cart with quantity N sets it to 1, not N+1, and shows no message. The record stating this (SC-BR-0001) is pending, so the spec does not yet cover a re-add. Whether it is intended is the Business Owner's decision.
- **D2 Missing catalog item.** `GenericCatalogDAO.getItem` returns `null` when the item is not found for the locale. It does not throw. The cart then dereferences `item.getItemId()`, which raises an unhandled `NullPointerException`, not the caught `CatalogException`. On the EJB path the cart uses, a SQL failure also escapes: `CatalogEJB.getItem` wraps it in an `EJBException`. `CatalogException` is raised only when the catalog EJB cannot be created (`CatalogHelper.getCatalogEJB`). So the skip path (pending record SC-BR-0005, not in the spec) covers only an unavailable catalog component. A line whose item was deleted or has no row for the session locale probably breaks the cart page entirely. Confirm on a running instance.
- **D3 Ghost lines.** When a line is skipped, the cart still counts it. If every line is skipped, the count is non-zero, so the page shows the non-empty layout with no lines and a total of 0.00 instead of the empty message.

## Open questions (Intent)

- **Q1 Unreachable add-with-quantity.** An SME approved SC-BR-0009, so the spec carries it (SWHR2-R-0033). In the legacy code the method is not reachable through the published interface, so no legacy screen exercises it. Pass B's SC-RULE-0008 states the same rule and is still pending.
- **Q2 Cart total versus order total.** The cart subtotal and the checkout order total use the same formula, but the order total is computed separately in checkout. Whether the two may ever differ (for example, a price change between viewing the cart and placing the order) is not settled in the legacy code. See the checkout change.

## Records synthesised

- **Pass files:** `components/cart/a.yaml`, `components/cart/b.yaml`, `apps/petstore/a.yaml`, `apps/petstore/b.yaml` under `legacy-analysis/ir/_passes/legacy-source/petstore1.3.2/src/`.
- **Also:** `waf/a.yaml` (CART-WF-0008).
- **Spec scope:** only the 11 approved records are in the spec. The other records, including the quantity update, item count, subtotal, line details, locale and re-add reset behaviour described above, are Not specified until an SME approves them.
- **Key collisions:** record keys repeat across pass files with different content. The recommendations file therefore names the pass file for each entry.

## Target design

### Components

- **Cart model** `services/cart/index.ts` works on the cart held in the storefront session (sign-on). The cart is a `Map<itemId, quantity>`, created empty on first use with one per session (SWHR2-R-0114). Functions:
  - `addItem(cart, itemId)` sets the quantity to 1 (SWHR2-R-0144). Re-adding an item therefore sets its quantity back to one, which is the specified behaviour noted in the PRD constraints.
  - `addItemWithQuantity(cart, itemId, qty)` replaces any existing quantity and does not validate it (SWHR2-R-0033).
  - `removeItem(cart, itemId)` deletes the line whatever its quantity, and is a no-op when the item is absent (SWHR2-R-0146).
  - `updateQuantities(cart, { itemId: qty })` sets the given quantities.
  - `clear(cart)` empties the cart; checkout calls it once an order is placed (SWHR2-R-0147).
  - `lines(cart, locale)` resolves each line through the catalog service in the cart locale (localization SWHR2-R-0081). It returns the item attribute, product name, quantity, unit price (unit cost) and line total, plus the cart total.

  Line order is Map iteration order, and no order is promised (SWHR2-R-0034).

- **Session-only cart.** The cart exists only in the in-memory session, is never written to SQLite, and goes when the session ends by sign-out or idle expiry (SWHR2-R-0118, SWHR2-R-0114.03).
- **No role check.** The cart routes call no guard, so visitors use every cart operation without signing on (SWHR2-R-0117).
- **Failure routing** `services/errors.ts` and `src/errors/routeFailure.ts` (SWHR2-R-0116):
  - API routes throw typed failures (`EmptyCartOrder`, `SignOnRequired`, `CatalogError`, …), each with a parent kind (for example `EmptyCartOrder` belongs to `OrderFailure`, which belongs to `AppFailure`).
  - Responses carry `{ kind, kinds: [kind, …parents], message, trace }`.
  - The SPA keeps one table from failure kind to error page and walks `kinds` until it finds a configured page. With no configured page it shows the Server Error page (checkout SWHR2-R-0003). The empty-cart order error page is `src/pages/petstore/error/empty-cart.tsx`.
- **Cart page** `src/pages/petstore/cart.tsx` (SWHR2-R-0115). When the cart is empty it renders the shared `EmptyFrame` with "Your Shopping Cart is Empty." and no rows, total, Update Cart or Check Out. Otherwise it renders one row per line:
  - the item attribute and product name, linked to `item/[itemId]`
  - Remove
  - a quantity input pre-filled with the line quantity
  - the unit price formatted as currency

  Below the rows are Update Cart (submits the edited quantities), the total formatted as currency, and a Check Out link to `checkout`. After Remove the page re-renders from the response. The pet-tips banner (customer-account) is also shown here.

### Data

No persisted data (SWHR2-R-0118). The cart lives in the session record as `cart: Map<string, number>`. Prices are not stored in the cart; they are read from the catalog in the session locale every time lines are listed, so a locale change re-prices the cart (localization SWHR2-R-0076).

### Interfaces

Every route returns the full cart view `{ lines: [...], total, locale }` and needs no authorisation.

- `GET /api/cart`
- `POST /api/cart/items` with `{ itemId, quantity? }`: without `quantity` it sets 1, and with `quantity` it replaces the existing one.
- `DELETE /api/cart/items/[itemId]`
- `PUT /api/cart` with `{ quantities: { [itemId]: number } }` (Update Cart)

The Add to Cart controls on the product item list, item detail and search results call `POST /api/cart/items`.

### Stack choices

- Nitro (H3) routes under `routes/api/cart/` over the in-memory session store (sign-on). There is no Drizzle table, because the spec forbids durable storage.
- Currency formatting uses `shared/i18n/format.ts` (localization).
- Tests: unit tests for the cart model (re-add sets 1, remove absent item, replace quantity); route integration tests proving two sessions do not share a cart and sign-out empties it; UI tests for the empty and filled cart screens.

## Planning — SWHR2-S-0016

### Codebase findings (measured on the sprint branch, 2026-10-30)

Part of the cart already exists. It was built by localization (SWHR2-I-0003) and catalog-browsing (SWHR2-I-0004) so that their cases had a cart to put items in.

- `services/cart.ts`: a module-level `Map<sessionId, Map<itemId, qty>>`, plus `cartFor`, `addItem`, `lines(cart, locale?)`, `discardCart` and `moveCart`. `addItem` **increments** the quantity (`+1`), but this change requires 1 (SWHR2-R-0144; D1 above). `lines` returns `{ itemId, quantity, name, attribute, unitPrice }`. It reads `name` from the item description and `unitPrice` from the list price in integer hundredths, and skips lines the catalog cannot find. Nothing implements add-with-quantity, remove, update or clear.
- `services/session/store.ts`: `end(session)` calls `discardCart`, so sign-out (`signOut`) and idle expiry (`sweep`, `attachSession`) already discard the cart. `renewSession` (sign-in) moves the anonymous cart to the new session id. SWHR2-R-0114.03 and SWHR2-R-0118 already hold at the session layer.
- `routes/api/cart/index.get.ts` returns `{ locale, lines }` with no `total`. `routes/api/cart/items.post.ts` takes `{ itemId }`, ignores `quantity` and returns `{ count }`. There is no DELETE or PUT route. Neither route calls a guard (SWHR2-R-0117 holds).
- `src/pages/petstore/cart.tsx` renders lines as a `<ul>` with no link, Remove, quantity input, Update Cart, total or Check Out. Its empty state is `EmptyFrame` with the message from `src/locales/<locale>/petstore-cart.ts`. In en_US that message is still the placeholder "Your cart will appear here once the cart ships." (ja_JP and zh_CN carry the same placeholder). The pet-tips banner is already on the page.
- `src/components/storefront/AddToCart.tsx` POSTs `{ itemId }`, stays on the page and shows an "added" status. It is used in the product item table (`product/[productId].tsx`), on item detail (`item/[itemId].tsx`) and in the search results table (`search.tsx`). Both tables render `<tr>` rows.
- Failure routing does not exist. There is no `services/errors.ts`, no `src/errors/`, no `src/pages/petstore/error/` and no Server Error page. Today failures are ad hoc: `HTTPError` with `data.kind` (`InvalidCredentials`, `SignOnRequired`), and `catalogResponse` maps `CatalogError` to a 500.
- Checkout (SWHR2-I-0008) has not been built: there is no `routes/api/orders/`, no `/petstore/checkout` page and no order tables.
- Locked acceptance suite: `tests/acceptance/shopping-cart/` (`harness.ts`, `cart.test.ts`, `cart-page.test.tsx`, `e2e/cart.spec.ts`). Other suites also exercise Add to Cart: catalog-browsing C-0200, sign-on C-0252/C-0269, localization C-0022, checkout and data-population.

### Planning decisions

- **P1 Keep `services/cart.ts`.** Target design names `services/cart/index.ts`. The file already exists at `services/cart.ts`, and both the acceptance suite and session store import `services/cart`, which resolves to either path. Do not move it.
- **P2 Re-add sets 1.** `addItem` becomes `cart.set(itemId, 1)` (SWHR2-R-0144, D1). `addItemWithQuantity(cart, itemId, qty)` sets `qty` with no validation (SWHR2-R-0033). `removeItem` uses `cart.delete` (SWHR2-R-0146). `updateQuantities(cart, quantities)` sets each given quantity. `clear(cart)` empties the cart. None of them throws. Zero and negative quantities on update are an open SME record and not specified, so do not invent removal-on-zero.
- **P3 One cart view from every route.** `GET /api/cart`, `POST /api/cart/items`, `DELETE /api/cart/items/[itemId]` and `PUT /api/cart` all return `{ locale, lines, total }`. `total` is Σ `unitPrice × quantity` in integer hundredths (Key Decision "Money is integer hundredths"). Keep the existing `CartLine` fields. A new field may be added only if the existing assertions in `services/cart.test.ts` (localization C-0033/C-0034, `toEqual`) are updated in the same commit.
- **P4 Add to Cart opens the cart.** After a successful POST, `AddToCart` navigates to `/petstore/cart`, as the legacy `cart.do` did. C-0093, C-0096 and C-0097 click Add to Cart on the product or search page and then expect a cart row with a quantity input, with no other navigation.
- **P5 Cart screen is a table.** Render one `<tr>` per line (the e2e cases locate rows by role `row`). Each row has a link whose name contains the line `name`, to `/petstore/item/<itemId>`, and shows the item id **once** as text. C-0200 uses a strict `getByText("EST-1")`, and C-0088 expects that text to disappear after Remove. Each row also has a Remove `<button>`, a quantity input (`type="number"` or text) pre-filled with the quantity, and the unit price via `formatMoney`. Below the table come an Update Cart button (PUT), the total via `formatMoney`, and a Check Out link to `/petstore/checkout`. The empty state renders no table, no money text, no Update Cart and no Check Out (C-0087). The en_US empty message becomes "Your Shopping Cart is Empty.", and ja_JP and zh_CN get translations. After Remove or Update Cart the page re-renders from the response view.
- **P6 Failure routing.**
  - `services/errors.ts` defines `AppFailure`, a base `Error` with a `kind` and a parent chain. It also defines `OrderFailure` (parent `AppFailure`) and `EmptyCartOrder` (parent `OrderFailure`, HTTP 422), plus a `failureBody(err)` helper returning `{ kind, kinds, message, trace }`.
  - `src/errors/routeFailure.ts` exports `routeFailure(failure: { kind: string; kinds: string[] }, table?: Record<string, string>): string`. It walks `kinds` in order and returns the first mapped page. When nothing is mapped it returns the constant `SERVER_ERROR = "server-error"`.
  - The default table maps `EmptyCartOrder` to `/petstore/error/empty-cart`. That page (`src/pages/petstore/error/empty-cart.tsx`) has a heading containing "empty" and no "Server Error" text.
  - Throwing `EmptyCartOrder` from the order route, and the Server Error page itself, belong to checkout (SWHR2-I-0008; checkout SWHR2-R-0003).
- **P7 No new table, no migration.** The cart stays in memory (SWHR2-R-0118).

### Interface contracts fixed by the locked acceptance suite

- `services/cart` exports `addItem(cart, id)`, `addItemWithQuantity(cart, id, qty)`, `removeItem(cart, id)` and `lines(cart, locale)`. The view helpers `ids`/`qty` accept a `CartLine[]` or `{ lines }`, with lines keyed `itemId` and `quantity`.
- Route modules: `routes/api/cart/index.get.ts`, `routes/api/cart/items.post.ts` (body `{ itemId, quantity? }`) and `routes/api/cart/items/[itemId].delete.ts` (param `itemId`). The harness calls the handlers directly after the session middleware, and cookies are `ps_sid`.
- `src/pages/petstore/cart.tsx`: the default export renders inside a bare `MemoryRouter` with no `LocaleProvider`, and `fetch` is stubbed to return the view `{ locale, total, lines: [{ itemId, name, productName, quantity, unitPrice, lineTotal }] }` for every request. Unit price 1650 must render `$16.50` and total 3300 must render `$33.00`.
- `src/errors/routeFailure.ts`: `routeFailure({ kind, kinds }, table)` as in P6. An unmapped failure returns a value matching `/server/i`.

### Phases

1. Cart model (tasks 1.x, 2.x): P1 and P2 in `services/cart.ts`, with unit tests.
2. Routes (2.x): extend GET and POST, and add `items/[itemId].delete.ts` and `index.put.ts` (P3), with route tests in `routes/api/cart/` (`server` vitest project).
3. Failure routing (3.x): P6, with unit tests next to each file.
4. Cart screen and Add to Cart (4.x): P4 and P5, with locale strings and UI tests.
5. Test harness and CI (5.x): no harness changes are needed. Vitest's `client`/`server` projects already pick up the new tests by path, and `.github/workflows/ci.yml` already runs on pull requests into `vortex/**` (every ticket PR into the sprint branch) and on pushes to `dev`, so no CI change is needed. Add one Playwright spec, `e2e/cart.spec.ts`, covering add → cart → remove, executed at least once before it is committed. Run the locked `tests/acceptance/shopping-cart/` suite before handing off.

### Test cases deferred

These cases need checkout (SWHR2-I-0008), which builds `routes/api/orders/index.post.ts`, the order tables, the `/petstore/checkout` page and order placement. They are deferred to that brief and not linked here:

- C-0089: Check Out opens order entry with street/address fields.
- C-0090: the empty-cart order is refused with 422 `EmptyCartOrder` and no order rows.
- C-0101: placing an order empties the cart.

This sprint supplies what they depend on: the Check Out link, `clear()`, the `EmptyCartOrder` failure and the empty-cart error page.

### Spec discrepancies

- **SD1 File location.** Target design says `services/cart/index.ts`, but the code is in `services/cart.ts` (P1).
- **SD2 Existing add increments.** `services/cart.ts` `addItem` adds 1 to an existing line, which contradicts SWHR2-R-0144 and D1. The FEATURE corrects it.
- **SD3 "Item attribute and product name".** SWHR2-R-0115 says the row link carries the item attribute and the product name. Locked case C-0086 expects the link name "Large Angelfish", which is the item description (`name`), not the product name "Angelfish". The FEATURE follows the case, linking `name` and showing the attribute beside it.
- **SD4 Shared sign-in locator.** The e2e `signIn` helper in `tests/acceptance/shopping-cart/e2e/cart.spec.ts`, used by C-0085, fills `getByLabel(/password/i)` on `/petstore/signin`. That page has three password inputs since customer-account. This is the same strict-mode conflict disputed for sign-on C-0269 and tracked in DEFECT SWHR2-T-0244. C-0085 is linked. If T-0244 is unresolved when the FEATURE runs, its outcome follows that dispute.

### Assumptions

- Japanese and Chinese wording for the new cart labels and the empty message is the FEATURE's choice, following the existing `src/locales/*/catalog.ts` tone. No locked case checks it beyond C-0022 (zh_CN name and price).
