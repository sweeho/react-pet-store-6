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

## Planning (sprint SWHR2-S-0017)

Owner: FEATURE SWHR2-T-0253 does every task group in `tasks.md`, in order. Plan: `artifacts/SWHR2-S-0017/SWHR2-T-0253/PLAN.md`.

### Codebase findings

What the repository already has (built by catalog-browsing and sign-on, measured on the sprint branch at `6972c0b`):

- `services/cart.ts` (not `services/cart/index.ts`): module-level `Map<sessionId, Map<itemId, qty>>`; `cartFor`, `addItem` (**increments**), `lines(cart, locale)` returning `{ itemId, quantity, name, attribute, unitPrice }` from `services/catalog` `getItem` (skips an item it cannot find), `discardCart`, `moveCart`. Unit test `services/cart.test.ts` (C-0033/C-0034, locale lines).
- `services/session/store.ts`: the session's `end()` calls `discardCart` on sign-out and idle expiry; `renewSession` (sign-in) moves the cart to the new id; storefront sign-out starts a fresh session. So SWHR2-R-0114.03 and SWHR2-R-0118 are already wired; this change adds their tests.
- `routes/api/cart/index.get.ts` returns `{ locale, lines }` (no total); `routes/api/cart/items.post.ts` takes `{ itemId }` only and returns `{ count }`. Both fall back to an `"anonymous"` cart when no session is attached. No DELETE or PUT route.
- `src/components/storefront/AddToCart.tsx` is used by the product item list, item detail and search results; it POSTs and stays on the page with an "added" status.
- `src/pages/petstore/cart.tsx` is a placeholder list (no link, Remove, quantity input, total, Update Cart or Check Out); `src/locales/*/petstore-cart.ts` holds "Your cart will appear here once the cart ships.".
- Prices are integer hundredths (ARCHITECTURE.md Key Decisions); `shared/i18n/format.ts` `formatMoney` formats them.
- No `src/errors/`, no `services/errors.ts`; `services/catalog/errors.ts` has a `CatalogError` class. 401 responses already carry `data: { kind }` (`services/session/http.ts`).
- Checkout (change `swhr2-i-0008-checkout-and-order-placemen`) is not built: no `routes/api/orders`, no `/petstore/checkout`, no `src/pages/petstore/error/`.
- Acceptance tests already exist under `tests/acceptance/shopping-cart/` (`cart.test.ts`, `cart-page.test.tsx`, `e2e/cart.spec.ts`, `harness.ts`). They are the interface contract.

### Planning decisions

- **P1 Keep `services/cart.ts`.** Extend the existing module rather than move it to `services/cart/index.ts`; imports of `services/cart` resolve either way and the session store already depends on it.
- **P2 Re-add sets 1.** `addItem` changes from increment to `set(itemId, 1)`, per Target design and the brief (Solution, Add).
- **P3 Model functions.** Add `addItemWithQuantity(cart, itemId, qty)`, `removeItem(cart, itemId)`, `updateQuantities(cart, { [itemId]: qty })` (a quantity ≤ 0 removes the line, as the legacy update did) and `clear(cart)`; also `clearCart(sessionId)` for checkout to call after placement.
- **P4 Cart view.** Every cart route returns `{ locale, lines, total }`, each line `{ itemId, name, attribute, productName, quantity, unitPrice, lineTotal }`, money in hundredths. Drop the `"anonymous"` fallback: the session middleware always attaches a storefront session.
- **P5 Routes.** Add `routes/api/cart/items/[itemId].delete.ts` and `routes/api/cart/index.put.ts`; `items.post.ts` accepts optional `quantity`. No guard on any (SWHR2-R-0117).
- **P6 Add then show the cart.** `AddToCart` navigates to `/petstore/cart` after a successful add, as legacy `cart.do` did; the acceptance E2E (C-0096, C-0097, C-0093) expects the cart rows after Add.
- **P7 Failure routing.** `services/errors.ts` defines `AppFailure` and its sub-kinds with a parent chain and a helper that raises an H3 error whose `data` is `{ kind, kinds, message }`. `src/errors/routeFailure.ts` exports `routeFailure(failure, table)` returning the first page in `table` along `failure.kinds`, else the `"server-error"` page id. The default table maps `EmptyCartOrder` to `empty-cart`. Checkout builds the pages themselves.
- **P8 Cart screen.** A table (`role="row"` per line) following the approved mockups; empty state is the shared `EmptyFrame` with "Your Shopping Cart is Empty." in en_US and its ja_JP/zh_CN equivalents in the locale definitions.

### Phases

1. Cart model (tasks 1.x, 2.x model side) with unit tests in `services/cart.test.ts`.
2. Routes (2.x) with integration tests under `routes/api/cart/`.
3. Failure routing (3.x) with unit tests.
4. Cart screen and Add to Cart (4.x) with UI tests.
5. **Test harness.** Make the existing acceptance suite in `tests/acceptance/shopping-cart/` pass for every linked case; the vitest and Playwright acceptance configs already pick it up. Keep `tests/acceptance/catalog-browsing/e2e/browse.spec.ts` C-0200 green after the Add to Cart navigation change.
6. **CI.** No workflow change: the existing CI runs lint, typecheck, unit, E2E and the acceptance suites on pushes and pull requests to `vortex/**`. The branch must be green there.

### Test cases deferred to checkout (SWHR2-I-0008)

C-0089 (Check Out lands on order information entry), C-0090 (empty-cart order error page, needs `POST /api/orders`) and C-0101 (placing an order empties the cart) exercise checkout's route and pages. This change provides the Check Out link, `routeFailure` with the `EmptyCartOrder` mapping, and `clearCart`; checkout's sprint owes the cases.

## Spec discrepancies

Recorded, not edited into the delta spec.

- **SD1 Re-add.** `services/cart.ts` `addItem` increments an existing line (legacy pass A reading). The design and brief say re-add sets 1; the spec only covers the first add (SWHR2-R-0144). Built as the design says (P2).
- **SD2 Shared anonymous cart.** The cart routes fall back to one `"anonymous"` cart when no session is attached, which would share a cart across requests (against SWHR2-R-0114). Unreachable in practice because the session middleware always attaches one; removed (P4).
- **SD3 Missing catalog items.** `lines()` silently skips an item the catalog no longer returns while the map entry stays, so `items.post` reports a count that includes it (legacy D3 "ghost lines"). The spec says nothing; the total and empty check are computed from the listed lines so an all-ghost cart shows the empty message.
- **SD4 Scenarios that need checkout.** SWHR2-R-0115.04, SWHR2-R-0116.01 and SWHR2-R-0147.01 can be observed only through checkout, which is a later capability. Their cart-side parts are built here; their cases are deferred.
- **SD5 Module path.** Target design names `services/cart/index.ts`; the code has `services/cart.ts` (P1).
- **SD6 Screen row content.** The spec asks for "item attribute and product name"; the acceptance test C-0086 finds the link by the item description ("Large Angelfish"). The row shows the item description as the link text, plus attribute and product name.
