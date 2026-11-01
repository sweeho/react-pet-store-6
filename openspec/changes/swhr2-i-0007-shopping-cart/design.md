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

## Planning — SWHR2-S-0022

One FEATURE, **SWHR2-T-0276**, owns every task group in `tasks.md` (1 to 5, in order). Its plan is `artifacts/SWHR2-S-0022/SWHR2-T-0276/PLAN.md`.

### Measured code state (sprint branch at 8d6f873)

Part of the cart was built by earlier sprints to support catalog, localization and sign-on:

- `services/cart.ts` (flat file, not `services/cart/index.ts`) holds a module-level `Map<sessionId, Map<itemId, qty>>` with `cartFor`, `addItem`, `lines`, `discardCart` and `moveCart`. **`addItem` increments** (`(get ?? 0) + 1`); it does not set 1. `lines` returns `{ itemId, quantity, name, attribute, unitPrice }`, where `name` is the item description and `unitPrice` the list price in hundredths. There is no `total`, `productName` or `lineTotal`.
- `services/session/store.ts` already discards the cart when a session ends (`end` → `discardCart`): on sign-out, on idle expiry, and in `attachSession` for an expired id. `renewSession` keeps the cart across sign-in (`moveCart`). So tasks 1.2–1.4 are mostly built, and only need tests.
- `routes/api/cart/index.get.ts` returns `{ locale, lines }`. `routes/api/cart/items.post.ts` takes `{ itemId }`, ignores `quantity`, and returns `{ count }`. There is no remove route and no Update Cart route. Neither route has a guard; both fall back to cart id `"anonymous"` when no session is attached.
- `src/pages/petstore/cart.tsx` is a placeholder list (`<ul>`, no links, no controls). Its `petstore-cart` screen definition says "Your cart will appear here once the cart ships."
- `src/components/storefront/AddToCart.tsx` posts `{ itemId }` and shows an inline status. It is used on the product item list, item detail and search results, which already render `<table>` rows.
- No failure kinds exist. `routes/api/catalog/items/[itemId].get.ts` throws a bare 404 `HTTPError`. `services/catalog/errors.ts` has `CatalogError`. `src/errors/`, `services/errors.ts`, `src/pages/petstore/error/`, `routes/api/orders/` and `src/pages/petstore/checkout.tsx` do not exist.
- The locked acceptance suite `tests/acceptance/shopping-cart/` (`cart.test.ts`, `cart-page.test.tsx`, `e2e/cart.spec.ts`, `harness.ts`) fixes the contracts below.

### Planning decisions

- **P1 Keep `services/cart.ts`.** Extend the existing flat module instead of moving it to `services/cart/index.ts`. Every importer, including the locked suite (`../../../services/cart`), resolves the flat file. A move is churn with no behaviour.
- **P2 Add sets 1.** Change `addItem` to `cart.set(itemId, 1)`, as Target design and SWHR2-R-0144 say. The existing increment came from a pass-A reading that this design's legacy notes refute.
- **P3 Failure kinds live in `services/errors.ts`, routing in `src/errors/routeFailure.ts`.** There is one `AppFailure` base class whose subclasses declare `kind` and their parent kind. The reply body is `{ kind, kinds, message, trace }`. Cart routes and the catalog item route wrap their body in one helper, which:
  - rethrows an `AppFailure` as an `HTTPError` that carries that body as `data` and the failure's status;
  - turns any other error into a 500 `AppFailure` reply whose `message` keeps the original message.
- **P4 Error-page table.** `routeFailure(reply)` walks `reply.kinds` against one table and returns the error page's route:
  - `EmptyCartOrder` → `/petstore/error/empty-cart`
  - `CatalogError` → `/petstore/error/catalog`
  - any other kind → `/petstore/error/server`
    `ItemNotFound` (parent `CatalogError`) has no entry of its own. The pages are `src/pages/petstore/error/{empty-cart,catalog,server}.tsx`. The server page is minimal here; checkout SWHR2-R-0003 owns its final wording.
- **P5 Add navigates to the cart.** After a successful `POST /api/cart/items`, `AddToCart` navigates to `/petstore/cart`, as the legacy `cart.do` does. The locked E2E cases C-0093, C-0096 and C-0097 read the quantity field on the cart screen straight after the click.
- **P6 Cart line name.** The row link text is the line's `name` (the item description, "Large Angelfish"). It is followed by `productName`, and by `attribute` when present. See the spec discrepancies.
- **P7 Checkout seam.** This change ships `clearCart(sessionId)` and the `EmptyCartOrder` kind. Checkout SWHR2-I-0008 calls and throws them from `routes/api/orders/index.post.ts`. The Check Out link points at `/petstore/checkout`, which checkout builds.

### Interface contracts (fixed by the locked suite)

- `services/cart.ts` exports `cartFor`, `addItem(cart, itemId)` (sets 1), `addItemWithQuantity(cart, itemId, qty)` (replaces, no validation), `removeItem(cart, itemId)` (no-op when absent), `updateQuantities(cart, { [itemId]: qty })`, `clearCart(sessionId)`, `lines(cart, locale)`, `discardCart` and `moveCart`. `lines` returns an array of `{ itemId, name, attribute, productName, quantity, unitPrice, lineTotal }` in hundredths.
- `GET /api/cart`, `POST /api/cart/items` `{ itemId, quantity? }`, `DELETE /api/cart/items/[itemId]` (file `routes/api/cart/items/[itemId].delete.ts`) and `PUT /api/cart` `{ quantities }` each return `{ locale, lines, total }` with status 200, and none is guarded.
- `GET /api/catalog/items/NO-SUCH-ITEM` fails with status 404 and data `{ kind: "ItemNotFound", kinds: ["ItemNotFound", "CatalogError", "AppFailure"], message, trace }`.
- An unexpected error inside a cart route fails with status 500 and data `{ kind: "AppFailure", kinds: ["AppFailure"], message: <original message>, trace }`.
- `src/errors/routeFailure.ts` exports `routeFailure(reply: { kind: string; kinds: string[] }): string`, which returns the page route.
- `src/pages/petstore/error/empty-cart.tsx` renders text that mentions the cart being empty, without the words "server error", and renders inside a bare `MemoryRouter` (no providers).
- `src/pages/petstore/cart.tsx` renders a `<table>` with one row per line. Each row carries:
  - an `<a href=".../item/<itemId>">` link to the item;
  - a Remove `<button>`;
  - a quantity textbox holding the quantity;
  - the unit price as currency.
    Below the rows come an Update Cart `<button>`, the total as currency and a Check Out link. The empty state renders `EmptyFrame` with "Your Shopping Cart is Empty." and no `<table>`. The page must render inside a bare `MemoryRouter` with only `fetch` stubbed.

### Phases

1. Cart model (tasks 1.x, 2.x model half): extend `services/cart.ts` per P1/P2.
2. Cart routes (2.x): add `quantity` to the add route and add the remove and update routes. All return the full view and take no guard.
3. Failure routing (3.x): `services/errors.ts`, the route wrapper, `ItemNotFound` on the catalog item route, `src/errors/routeFailure.ts` and the three error pages.
4. Cart screen (4.x): rebuild `cart.tsx` to the mockups, update the `petstore-cart` definitions in en_US, ja_JP and zh_CN, and add P5 to `AddToCart`.
5. **Test harness:** colocated tests for each part:
   - unit tests next to `services/cart.ts` and `services/errors.ts`;
   - route tests under `routes/api/cart/`;
   - a UI test next to `cart.tsx` and the error pages.
     Update the colocated catalog tests whose expectation P2/P5 changes (`src/pages/petstore/item/[itemId].test.tsx` C-0200 status assertion). The locked `tests/acceptance/shopping-cart/` suite runs unmodified.
6. **CI:** no workflow change. `.github/workflows/ci.yml` already runs on pull requests to `vortex/**`, and runs typecheck, lint, unit, acceptance, build, E2E and acceptance E2E plus the red-green replay. The ticket is done when that pipeline is green on its PR.

### Test cases deferred

C-0089 (Check Out opens order entry), C-0090 (empty-cart order refused) and C-0101 (order placed empties the cart) are deferred to checkout SWHR2-I-0008. They need `routes/api/orders/index.post.ts`, `src/pages/petstore/checkout.tsx` and the order tables, which that change builds. This change ships the seams they use (P7).

## Spec discrepancies

Recorded at planning (SWHR2-T-0275). The spec is unchanged.

- **SD1 Re-add.** The code increments a re-added item (`services/cart.ts addItem`). The brief and Target design say adding again sets it back to 1, and SWHR2-R-0144 says add "with a quantity of one". The FEATURE follows the spec (P2). The record covering re-add (SC-BR-0001) is still pending, so no scenario pins it.
- **SD2 Row label.** SWHR2-R-0115 says each row carries "the item attribute and product name". In this repository, item details carry a full description ("Large Angelfish"), `attr1` is free text ("Spotted fish"), and the scenario expects the link text "Large Angelfish". The FEATURE links the description and shows the product name and attribute beside it (P6).
- **SD3 Module path.** Target design names `services/cart/index.ts`, but the code and the locked suite use `services/cart.ts` (P1).
- **SD4 Anonymous fallback.** Both existing cart routes use cart id `"anonymous"` when no session is attached. In production the session middleware always attaches one, but the fallback would let sessionless callers share one cart, which contradicts SWHR2-R-0114. The FEATURE drops the fallback and reads the session through `sessionOf`.
- **SD5 Empty-cart page reachability.** SWHR2-R-0116.01 is reachable only through checkout's order route, which does not exist yet. Its case is deferred (see above).
