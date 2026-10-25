# Rebuild guidance: Java Pet Store 1.3.2 (spec extraction SX-0001)

This file tells whoever builds a capability from `build/manifest.yaml` how to use what spec extraction SX-0001 produced, and where the legacy system is easy to copy by mistake. It is guidance for the rebuild. It is not a spec, and it adds no requirements.

## 1. What is authoritative

From most to least authoritative:

1. **The capability delta spec**, `openspec/changes/sx-<capability>/specs/<capability>/spec.md`. This is what gets built and tested. Every requirement in it is a draft. None is SME-approved yet, so none carries an `ID:` line. Do not invent one.
2. **The capability `design.md`** in the same change directory. It explains where each behaviour lives in the legacy code and lists suspected defects (`D1`, `D2`, ...) and open questions (`Q1`, ...). A behaviour that `design.md` marks as a suspected defect is built as the spec states it until the Business Owner decides otherwise. Do not quietly "fix" it, and do not quietly drop it.
3. **`legacy-analysis/ir/_recommendations/<capability>.yaml`**: one accept/edit/reject recommendation per IR record. These are recommendations, not decisions.
4. **`api/openapi.yaml`, `architecture/erd.mermaid`, `architecture/schema.sql`**: evidence of what the legacy system exposes and stores. They are not a design. Where one disagrees with a delta spec, the delta spec wins.
5. **`legacy-source/`**: the code itself. Read it to settle a question the documents above leave open, and cite it in the ticket when you do.

Record keys repeat across pass files with different content (for example, `SALES-REQ-0001` names three different records). Always resolve a key together with the pass file named in the recommendations file's `source` field.

## 2. Build order

`build/manifest.yaml` schedules the 12 capabilities in this order. Each depends only on capabilities scheduled before it.

| Order | Capability             | Depends on                                             |
| ----- | ---------------------- | ------------------------------------------------------ |
| 1     | localization           | none                                                   |
| 2     | catalog-browsing       | localization                                           |
| 3     | sign-on                | none                                                   |
| 4     | customer-account       | sign-on                                                |
| 5     | shopping-cart          | catalog-browsing                                       |
| 6     | checkout               | shopping-cart, customer-account, sign-on               |
| 7     | order-approval         | checkout, sign-on                                      |
| 8     | supplier-inventory     | sign-on                                                |
| 9     | order-fulfillment      | order-approval, supplier-inventory                     |
| 10    | customer-notifications | order-approval, order-fulfillment                      |
| 11    | sales-reporting        | checkout, order-approval                               |
| 12    | data-population        | catalog-browsing, customer-account, supplier-inventory |

`data-population` comes last because it seeds the stores the other capabilities own. Earlier capabilities need test fixtures in the meantime. Take the fixture values from the data-population spec's seed content (5 categories, 16 products, 28 items in 3 locales, 4 users, stock at 10000) so that the fixtures and the eventual seeder agree.

## 3. Translating the legacy shape onto this repository's stack

The rebuild is a Vite React SPA with a Nitro (H3) server, SQLite through Drizzle, and Tailwind CSS-first (see `ARCHITECTURE.md`). The legacy system is four J2EE web applications, about 20 EJBs and three databases. Do not reproduce that structure.

| Legacy                                                                                | Rebuild                                                                                                                                                                                |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Storefront `*.screen` pages (JSP templates)                                           | Pages under `src/pages/`                                                                                                                                                               |
| Storefront `*.do` actions, the admin XML data service, the supplier request processor | JSON handlers under `routes/api/`                                                                                                                                                      |
| Three datasources (PetStoreDB, OPCDB, SupplierDB)                                     | One SQLite database: tables in `db/schema.ts`, migrations generated into `drizzle/` with `db-generate`                                                                                 |
| JMS queues and topics between storefront, order processing and supplier               | In-process steps. Introduce a persisted job or outbox table only where a spec requires asynchronous, retried or ordered delivery (for example customer-notifications' queued delivery) |
| Stateful session beans (cart, sign-on state)                                          | Session state the server owns. The cart is session-only in the spec, so do not persist it unless the spec changes                                                                      |
| CMP entity beans with container-managed relationships                                 | Drizzle tables with real foreign keys                                                                                                                                                  |
| Java Web Start admin rich client                                                      | Admin pages in the same SPA                                                                                                                                                            |
| `web.xml` / `signon-config.xml` protection lists                                      | Route-level checks in `middleware/` or in each handler, plus a role check on every admin and supplier route                                                                            |

Things in the legacy schema that should not reach the new one:

- **Duplicated tables.** ContactInfo, Address, CreditCard and LineItem each exist in two or three databases only because the datasources are separate. Whether an order keeps its own copy of the contact details and card is a requirement question, and the checkout spec answers it: the order keeps a separate copy. Model that as order-owned rows, not as three parallel table sets.
- **Container key columns** (`__PMPrimaryKey`, `__reverse_*`) are reference-implementation artefacts. Use ordinary integer keys and foreign keys.
- **Floating-point money.** `poValue`, `unitPrice` and the cart subtotal are `REAL` or `double`. The catalog stores `decimal(10,2)`. Store money in integer minor units. Where a spec states a legacy rounding behaviour, test it explicitly instead of inheriting it from float arithmetic.
- **Epoch-millisecond dates** (`poDate`) and `M/D/YYYY` report dates are wire formats, not a model. Report date-range semantics, including the effectively exclusive end date, are stated in the sales-reporting spec.
- **Plain-text passwords** (`UserEJBTable.password`) and the **unmasked card number**. The sign-on and customer-account specs record what the legacy system does, and their `design.md` files list these as suspected defects. Hash passwords whatever the Business Owner decides about the rest, because storing plain-text credentials is not a behaviour any spec asks the rebuild to preserve. Raise anything else as a decision, not a silent change.

## 4. Cross-cutting rules that are easy to miss

These rules span several capabilities. Each one is stated in full in the spec named in brackets.

- **Locale is part of every catalog key, with no fallback.** Category, product and item details exist per locale, and a missing locale row means no data, not English data (catalog-browsing, localization). Prices are stated per locale, not converted (localization).
- **Supported locales are en_US, ja_JP and zh_CN.** The change-language screen also offers de_DE, which has no page set. Whether zh_CN and de_DE are in scope is an open Business Owner question (localization `design.md`).
- **Order ids** come from a counter named `1001`, and the issued id is the name followed by the counter, so the first order is `10011` (checkout).
- **The payment card on every order is fixed** to `1234-2334` / `Duke Express` / `10/2001`, whatever card the account holds. Checkout collects no card (checkout). The rebuild needs a Business Owner decision before it takes real payment.
- **Auto-approval thresholds** depend on locale: US under 500, Japan under 50000, every other locale never (order-approval).
- **Order status values** are PENDING, APPROVED, DENIED, SHIPPED_PART and COMPLETED for customer orders, and PENDING, APPROVED, DENIED and COMPLETED for supplier orders (order-fulfillment). The admin tool sends status values that the server does not validate (order-approval).
- **Stock is drawn down whole-line or not at all**, and an inventory update overwrites the count (supplier-inventory, order-fulfillment).
- **Access control gaps are recorded, not endorsed.** The admin XML data endpoint has no role constraint, only a session check. The storefront `order.do` action is not on the protected list. Population can be triggered anonymously (sign-on, data-population). Every admin, supplier and population route in the rebuild needs an explicit authorisation decision recorded on its ticket.
- **Session lifetimes**: storefront 15 minutes idle, admin and supplier 54 minutes (sign-on).

## 5. Screens

`build/manifest.yaml` lists one `canvas.screens` line per extracted screen record (19 across 9 capabilities). customer-notifications, data-population and order-fulfillment have no screen records and no user interface. Do not invent one for them. Build the visual layer to `DESIGN.md`, not to the legacy JSP markup. The legacy image-map home page, frames and the Java Web Start client are presentation, not requirements, except where a screen record states them.

## 6. Evidence and tests

- Every requirement traces to legacy source lines through its IR records (`evidence.irRefs` in the manifest). When a test encodes a legacy value, such as a threshold, a message text or a seed count, put the IR record key in the test name or a comment. A later Business Owner decision can then find every test it overturns.
- Message texts quoted in a spec (for example "Unable to change language to fr") are requirements in their own right. Test them verbatim unless the spec says otherwise.
- `reviewedBy` and `reviewedAt` are `null` for every capability. No SME has approved any record yet, so treat the specs as drafts that may still move.
