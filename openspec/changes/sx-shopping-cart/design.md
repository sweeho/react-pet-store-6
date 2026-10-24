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

## How the behaviours are implemented

- **Add.** Product, item and search pages link to `cart.do?action=purchase&itemId=<id>`. `CartEJBAction` calls `addItem(itemId)`, which runs `cart.put(itemId, 1)`. This overwrites an existing quantity, so adding again resets the line to 1. Petstore pass A described this as "each click adds one unit". The cart component shows that is wrong.
- **Update.** The cart page posts every quantity field to `cart.do?action=update`. `CartHTMLAction` parses each value with `new Integer(value)` and substitutes 0 on `NumberFormatException`. `updateItemQuantity` removes the key, then re-adds it only when the new quantity is greater than 0. So zero and negative values remove the line. An item id that is not in the cart is added. The text input has `maxlength="10"`, a markup-only limit, and the server has no upper bound. A value above the `int` range fails to parse and is treated as 0.
- **Remove.** Each line's Remove link calls `cart.do?action=remove&itemId=<id>` → `deleteItem` → `cart.remove`. Removing a missing id does nothing.
- **Count and empty check.** `getCount()` returns `cart.size()`, the number of lines. `cart.jsp` shows the empty message on `cart.count == 0`.
- **Lines and subtotal.** `getItems()` re-reads every line from the catalog on each call (`new CatalogHelper(false).getItem(itemId, locale)`, which goes through the catalog EJB) and builds a `CartItem` with `item.getListCost()` as unit cost. `getSubTotal()` sums `unitCost * quantity` in a Java `double` with no rounding. `ShoppingCartModel.getTotalCost()` repeats the same sum. Iteration is over `HashMap.keySet()`, so line order is undefined.
- **Locale.** The bean holds a `Locale` that defaults to `Locale.US` and changes through `setLocale`. The English `cart.jsp` forces `fmt:setLocale en_US` for currency formatting. The `ja` and `zh` copies force `ja_JP` and `zh_CN`. Currency formatting is therefore fixed by the page language, not by the cart locale.
- **Lookup failure.** `getItems()` catches `CatalogException` per line, prints it to stdout and skips the line. The map entry stays, so `getCount()` still counts it.
- **Persistence.** None. There is no entity bean, DAO or table for the cart. `ejbPassivate`, `ejbActivate` and `ejbRemove` are empty. The home's `create(HashMap startingCart)` is commented out.

## Suspected legacy defects (Business Owner decision, defect register)

- **D1 Re-add resets quantity.** Adding an item already in the cart with quantity N sets it to 1, not N+1, and shows no message. The spec records what the code does. Whether it is intended is the Business Owner's decision.
- **D2 Missing catalog item.** `GenericCatalogDAO.getItem` returns `null` when the item is not found for the locale. It does not throw. The cart then dereferences `item.getItemId()`, which raises an unhandled `NullPointerException`, not the caught `CatalogException`. On the EJB path the cart uses, a SQL failure also escapes: `CatalogEJB.getItem` wraps it in an `EJBException`. `CatalogException` is raised only when the catalog EJB cannot be created (`CatalogHelper.getCatalogEJB`). So the skip path in the spec covers only an unavailable catalog component. A line whose item was deleted or has no row for the session locale probably breaks the cart page entirely. Confirm on a running instance. The spec deliberately states no behaviour for this case.
- **D3 Ghost lines.** When a line is skipped, the cart still counts it. If every line is skipped, the count is non-zero, so the page shows the non-empty layout with no lines and a total of 0.00 instead of the empty message.

## Open questions (Intent)

- **Q1 Unreachable add-with-quantity.** `ShoppingCartLocalEJB.addItem(String, int)` (lines 115-117) is not declared on `ShoppingCartLocal` and has no container-transaction entry. No caller was found. It is left out of the spec and flagged for a decision (records SC-BR-0009 and SC-RULE-0008).
- **Q2 Cart total versus order total.** The cart subtotal and the checkout order total use the same formula, but the order total is computed separately in checkout. Whether the two may ever differ (for example, a price change between viewing the cart and placing the order) is not settled in the legacy code. See the checkout change.

## Records synthesised

- **Pass files:** `components/cart/a.yaml`, `components/cart/b.yaml`, `apps/petstore/a.yaml`, `apps/petstore/b.yaml` under `legacy-analysis/ir/_passes/legacy-source/petstore1.3.2/src/`.
- **Key collisions:** record keys repeat across pass files with different content. The recommendations file therefore names the pass file for each entry.
