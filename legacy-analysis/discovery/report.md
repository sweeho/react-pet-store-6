# SX-0001 discovery report: Java Pet Store 1.3.2

All paths below are relative to `legacy-source/petstore1.3.2/` unless they start with `legacy-`.

## Summary

The legacy tree is the Sun J2EE BluePrints **Java Pet Store 1.3.2**, built for the J2EE 1.3 reference implementation (Cloudscape DB, JMS, CMP 2.0 entity beans, MDBs). It is four deployable applications built from 18 reusable components and one in-house MVC framework (WAF):

| Application         | Role                                                                       | User-facing surface                                                                                                                               |
| ------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/apps/petstore` | Customer storefront                                                        | 19 screens (`src/apps/petstore/src/docroot/WEB-INF/screendefinitions_en_US.xml:45-202`), duplicated per locale under `docroot/ja/`, `docroot/zh/` |
| `src/apps/opc`      | Order Processing Center: approval, process state, invoicing, customer mail | none (MDBs + one admin facade EJB)                                                                                                                |
| `src/apps/supplier` | Supplier: fulfils purchase orders against inventory, issues invoices       | 7 JSPs (login, index, displayinventory, back, error, logout, populating)                                                                          |
| `src/apps/admin`    | Administrator: Java Web Start Swing rich client + web launcher             | 4 JSP/HTML pages + Swing panels (orders view, orders approve, bar/pie charts)                                                                     |

The four apps talk only through JMS and one remote EJB (see `dependency-graph.json`, edges with `type` other than `compile`):

```
petstore --jms/opc/OrderQueue--> opc.PurchaseOrderMDB
            (auto-approve or PENDING) --jms/opc/OrderApprovalQueue--> opc.OrderApprovalMDB
admin   --jms/opc/OrderApprovalQueue (approve/deny)--^       |
admin   --ejb OPCAdminFacadeEJBRemote (order lists, revenue)--> opc
opc.OrderApprovalMDB --jms/supplier/PurchaseOrderQueue--> supplier.SupplierOrderMDB
supplier (ship, full or partial) --jms/opc/InvoiceTopic--> opc.InvoiceMDB, opc.MailInvoiceMDB
opc internal: MailOrderApprovalQueue, MailCompletedOrderQueue, MailQueue --> Mailer MDB (SMTP)
```

## Method

- File inventory: 580 files kept (see `legacy-analysis/discovery/excluded.md` for the 67 dropped at ingest: 5 build-dir files, 62 media/fonts).
- `loc` = total lines of all text source in the module (`.java .jsp .xml .sql .properties .js .tld .html .xsd .dtd .xsl .txt`). It includes the ja/zh JSP copies and populate XML; `src/apps/petstore` is 19,151 lines of which 5,640 are Java and ~1,500 are seed-data XML.
- Dependency edges: `compile` edges count `com.sun.j2ee.blueprints.<package>` references across `.java/.jsp/.xml`, mapped package to module. Runtime edges come from JNDI/JMS bindings in each `src/apps/*/src/sun-j2ee-ri.xml`.
- `screens` counts screen definitions or user-facing pages owned by the module. Components own no screens.
- Score (1-10) weighs: business-rule density, money/state/security impact, undocumented literals, and number of dependents. Infrastructure with no business behaviour scores 1-2.

## Risk-ranked module inventory

| #   | Module                          | LOC   | Screens | Risk   | Score | Why                                                                                                                                            |
| --- | ------------------------------- | ----- | ------- | ------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/apps/petstore`             | 19151 | 19      | high   | 10    | All customer flows; WAF action/flow handlers; `mappings.xml` exception-to-screen routing; sign-on protected URLs; unprotected populate servlet |
| 2   | `src/apps/opc`                  | 5712  | 0       | high   | 9     | Order approval thresholds as bare literals; order state transitions across 6 MDBs; invoice reconciliation; mail XSL per locale                 |
| 3   | `src/apps/supplier`             | 4180  | 7       | high   | 8     | Inventory check and partial shipment; invoice publication; hard-coded supplier credentials                                                     |
| 4   | `src/components/processmanager` | 1322  | 0       | high   | 8     | Order status machine `PENDING/APPROVED/DENIED/SHIPPED_PART/COMPLETED` (`processmanager/ejb/OrderStatusNames.java:51-65`)                       |
| 5   | `src/components/purchaseorder`  | 2435  | 0       | high   | 8     | Purchase order entity, totals, line items, XML (de)serialisation                                                                               |
| 6   | `src/components/signon`         | 1559  | 0       | high   | 8     | Authentication filter and user store; plaintext password column                                                                                |
| 7   | `src/components/cart`           | 829   | 0       | high   | 7     | Cart model and totals feeding the order amount                                                                                                 |
| 8   | `src/components/catalog`        | 2866  | 0       | medium | 7     | Catalog DAO with two implementations (Cloudscape and Generic) selected by a config value; search and paging                                    |
| 9   | `src/apps/admin`                | 5689  | 8       | medium | 7     | Approve/deny pending orders; revenue/sales charts; date-range filtering                                                                        |
| 10  | `src/components/customer`       | 2385  | 0       | medium | 6     | Account, profile preferences, customer aggregate                                                                                               |
| 11  | `src/components/creditcard`     | 810   | 0       | medium | 6     | Card number/type/expiry storage (no validation rule found yet)                                                                                 |
| 12  | `src/components/supplierpo`     | 1975  | 0       | medium | 6     | Supplier order entity and its own status set (no `SHIPPED_PART`, `supplierpo/ejb/OrderStatusNames.java:51-60`)                                 |
| 13  | `src/waf`                       | 8709  | 0       | medium | 6     | Front controller, flow handlers, screen templating, locale handling; also ships a WAF sample docroot                                           |
| 14  | `src/components/mailer`         | 881   | 0       | medium | 5     | Mail transport, failure handling                                                                                                               |
| 15  | `src/components/xmldocuments`   | 2768  | 0       | medium | 5     | DTD/XSD schemas and TPA document formats exchanged between apps                                                                                |
| 16  | `src/components/uidgen`         | 756   | 0       | medium | 4     | Counter-based order id generation                                                                                                              |
| 17  | `src/components/lineitem`       | 871   | 0       | low    | 4     | Line item entity incl. quantity shipped                                                                                                        |
| 18  | `src/components/contactinfo`    | 1314  | 0       | low    | 4     | Contact info entity                                                                                                                            |
| 19  | `src/components/address`        | 1035  | 0       | low    | 3     | Address entity                                                                                                                                 |
| 20  | `src/components/asyncsender`    | 549   | 0       | low    | 3     | Fire-and-forget JMS sender                                                                                                                     |
| 21  | `setup.xml`                     | 267   | 0       | low    | 2     | Creates JMS queues, DBs, and realm users/groups                                                                                                |
| 22  | `docs`                          | 3158  | 0       | low    | 2     | Install/use docs (en, ja, zh); may state intended behaviour                                                                                    |
| 23  | `src/components/encodingfilter` | 180   | 0       | low    | 2     | Request character encoding filter                                                                                                              |
| 24  | `src/components/servicelocator` | 758   | 0       | low    | 1     | JNDI lookup caching; no behaviour                                                                                                              |
| 25  | `src/components/util`           | 181   | 0       | low    | 1     | Debug tracer; no behaviour                                                                                                                     |

## Hot spots found during the survey (for the extraction stages)

These are pointers, not requirements. Each needs extraction and confidence grading later.

- H1 **Auto-approval thresholds are bare literals keyed by locale.** `src/apps/opc/src/com/sun/j2ee/blueprints/opc/ejb/PurchaseOrderMDB.java:183-191`: US orders under 500 and JAPAN orders under 50000 are auto-approved; every other locale (including zh_CN) always waits for an administrator. The method comment calls it "just a stub for converting currency" for demo purposes. Expect low confidence and a human decision.
- H2 **Partial shipment.** `src/apps/supplier/src/com/sun/j2ee/blueprints/supplier/orderfulfillment/ejb/OrderFulfillmentFacadeEJB.java:129-131` ships a line only if inventory covers the full line quantity; lines 187-193 track `quantityShipped`. Interacts with `SHIPPED_PART` in the OPC status set.
- H3 **Two status vocabularies.** OPC has `SHIPPED_PART`; supplier PO does not. Check whether they disagree on meaning.
- H4 **Catalog DAO selection is unreadable.** The `param/CatalogDAOClass` env-entry values in `src/apps/petstore/src/docroot/WEB-INF/web.xml:190-196` and `src/components/catalog/src/ejb-jar.xml:55-61` were redacted at ingest by the secret scanner (`«REDACTED:secret-finding-31/32/64/65»`). They are class names, not secrets. Which DAO (Cloudscape vs Generic) is active, and whether their SQL differs, cannot be settled from the committed tree. `PopulateSQL.xml` also carries two DDL variants (char vs varchar, lines 51-146 and 179-274).
- H5 **Unprotected destructive endpoint.** `/Populate` is mapped in `src/apps/petstore/src/docroot/WEB-INF/web.xml:124,157` with no security constraint; `src/apps/petstore/src/docroot/populating.jsp:47` forwards a `forcefully` request parameter into it unescaped. The supplier app's `/Populate` is likewise outside its `<security-constraint>`.
- H6 **Credentials and passwords.** `setup.xml:188,194` creates realm users `jps_admin`/`admin` and `supplier`/`supplier`. `UserEJBTable` stores `password VARCHAR(255)` in clear (`src/apps/petstore/src/sun-j2ee-ri.xml:418`).
- H7 **Signed-on-only pages** are declared in `src/apps/petstore/src/docroot/WEB-INF/signon-config.xml:53-77` (customer, customer.do, enter_order_information, signon_welcome). Admin and supplier use container FORM auth with role `administrator`.
- H8 **Error paths as rules.** `mappings.xml:110-112` maps `ShoppingCartEmptyOrderException` and `DuplicateAccountException` to dedicated screens, which states the empty-cart and duplicate-account rules.
- H9 **Schema evidence.** CMP DDL in each `src/apps/*/src/sun-j2ee-ri.xml` and catalog DDL in `PopulateSQL.xml` are the highest-confidence sources (NOT NULL on `poDate`, `bannerPreference`, inventory `quantity`, counter).

## Dead or questionable reachability

- D1 `src/waf/src/docroot/` is a WAF sample web app (screens `waf`, `taglibs`, `cachetag`...) whose `mappings.xml` references `waf.controller...ChangeLocaleEJBAction`, which the petstore app replaces with its own. `src/waf/src/build.xml:90` and `src/waf/src/application.xml` package it as a separate `waf.war` sample application, not as part of the Pet Store storefront. Treat its screens as framework demo, not product behaviour; its controller/view classes are live (petstore's `web.xml:95,107` uses `MainServlet` and `TemplateServlet`).
- D2 Duplicate classes: `src/apps/opc/.../opc/ejb/TPAInvoiceXDE.java` vs `src/components/xmldocuments/.../tpa/TPAInvoiceXDE.java`, and `src/apps/supplier/.../orderfulfillment/ejb/TPASupplierOrderXDE.java` vs `xmldocuments/tpa/TPASupplierOrderXDE.java`. Extraction must establish which copy each app actually loads.
- D3 `src/components/catalog/.../dao/` has two DAO implementations; only one is live (see H4).

## Exclusions

- At ingest: 67 files (build directories, media and fonts). Full table in `legacy-analysis/discovery/excluded.md`.
- At discovery: `src/lib/` (JSTL `.tld` descriptors, Ant and Base64 licence files) is vendored third-party material with no application behaviour and is not listed in `risk-scores.csv`. Root licence/copyright HTML files, `src/build.*` and per-module `build.xml/.sh/.bat` and `*-manifest.mf` are build plumbing; they are inside their modules' paths but carry no requirements.
- Redaction: four `env-entry-value` strings were replaced by the secret scanner (H4). No other redactions were seen in the files read; a full grep for `«REDACTED` is recommended at extraction.

## Capabilities

The closed list is in `capabilities.csv` (12 keys). Rough module mapping:

| Capability             | Primary modules                                                          |
| ---------------------- | ------------------------------------------------------------------------ |
| catalog-browsing       | apps/petstore, components/catalog                                        |
| shopping-cart          | apps/petstore, components/cart                                           |
| sign-on                | components/signon, apps/petstore, apps/admin, apps/supplier, setup.xml   |
| customer-account       | apps/petstore, components/customer, contactinfo, address, creditcard     |
| checkout               | apps/petstore, components/purchaseorder, uidgen, creditcard              |
| order-approval         | apps/opc, apps/admin, components/processmanager                          |
| order-fulfillment      | apps/opc, apps/supplier, components/processmanager, supplierpo, lineitem |
| supplier-inventory     | apps/supplier                                                            |
| customer-notifications | apps/opc (customerrelations, xsl), components/mailer                     |
| sales-reporting        | apps/admin, apps/opc (admin facade)                                      |
| localization           | waf, apps/petstore, components/encodingfilter                            |
| data-population        | apps/petstore (tools/populate), apps/supplier (tools/populate)           |
