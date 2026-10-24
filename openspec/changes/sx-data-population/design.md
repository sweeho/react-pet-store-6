# Design notes: data-population (legacy implementation)

These notes record how the LEGACY Java Pet Store 1.3.2 implements sample-data population. They are input for the Architect, not a target design. Paths are relative to `legacy-source/petstore1.3.2/`.

## User interface

No screen records were extracted for this capability; its user interface is unspecified.

Basis: none of the 25 `data-population` records in the pass files has `kind: screen`, and this stage's prompt states no screen count. The legacy system does show two surfaces, and the requirements cover only their behaviour, not their layout:

- The start page (`src/apps/petstore/src/docroot/index.jsp` lines 77-82) has an "enter the store" link (`populating.jsp?forcefully=false`) and a "repopulate the demo's database" link (`populating.jsp?forcefully=true`). Both warn the visitor that population may take a while.
- Each application has a `populating.jsp` page that shows a please-wait notice and refreshes to `/Populate` after zero seconds (see "Population progress notice").

What these pages display and offer was never extracted as a screen record. If the rebuild needs them, raise screen records for them instead of inferring their layout from these notes.

## Request flow

1. `index.jsp` → `petstore/populating.jsp?forcefully=<f>`
2. META refresh → `petstore/Populate?success_page=//supplier/populating.jsp?forcefully=<f>&forcefully=<f>`
3. Petstore `PopulateServlet.doPost`, which invalidates the session, runs `populate(f)` and redirects to the success page. A `//` prefix is resolved against the request URL, so the redirect crosses to the supplier web app.
4. `supplier/populating.jsp` → META refresh → `supplier/Populate?success_page=//petstore/main.screen&forcefully=<f>`
5. Supplier `PopulateServlet` runs inventory population and redirects to `/petstore/main.screen`.

| Requirement                                 | Legacy location                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Automatic population, populated-state check | `src/apps/petstore/.../tools/populate/PopulateServlet.java` 145-177. `alreadyPopulated = catalogPopulator.check(conn) && customerPopulator.check() && userPopulator.check()`. `CatalogPopulator.check` requires category, product and item to be non-empty. The customer and user checks call `findAllCustomers` / `findAllUsers` and return false on any exception.                   |
| Catalog rebuild                             | `CatalogPopulator.dropTables` drops item, product, then category, and ignores errors. `createTables` creates them in reverse order. The statements come from `populate/PopulateSQL.xml` and are selected by the `Database` init-param (default `cloudscape`, `WEB-INF/web.xml` 133-137).                                                                                               |
| Sample account replacement                  | `CustomerPopulator.createCustomer` 101-131 and `UserPopulator.createUser` 98-114 call `findByPrimaryKey(id).remove()` (exceptions ignored) and then `create`.                                                                                                                                                                                                                          |
| Seed content                                | `src/apps/petstore/src/docroot/populate/Populate-UTF8.xml`. The petstore servlet parses it with a validating parser against `dtds/*.dtd`. Passwords are redacted in the ingested copy.                                                                                                                                                                                                 |
| Session ended                               | `PopulateServlet.doPost`: `request.getSession().invalidate()`. The code comment says this is "because all EJB Refs are no longer valid". It runs before the populated check, so even a no-op entry signs the visitor out.                                                                                                                                                              |
| Supplier gate                               | `src/apps/supplier/.../tools/populate/PopulateServlet.java` 98-124 and `InventoryPopulator.java` 83-113. `check()` means `findAllInventoryItems` is non-empty. `createInventory` removes an existing entity by primary key before it creates the new one.                                                                                                                              |
| Supplier seed                               | `src/apps/supplier/src/docroot/populate/Populate-UTF8.xml` 41-52 and 79-80: 29 `Inventory` elements, every one with `quantity="10000"`. `XMLDBHandler.getValue(name, 0)` returns 0 when the value is null or not a number. The supplier parser is non-validating (`setValidating` is commented out), so this default is reachable even though the DTD marks the attribute `#REQUIRED`. |
| Redirect and failure                        | Both `PopulateServlet.doPost` methods use the same success_page → Referer → (nothing) chain, and the same error_page → `ServletException` chain.                                                                                                                                                                                                                                       |
| Access without sign-on                      | `/Populate` is mapped in both `web.xml` files but sits outside every `<security-constraint>`. The supplier constraint covers only `/RcvrRequestProcessor` (web.xml 91-97). The petstore `/Populate` is absent from `signon-config.xml` 49-79.                                                                                                                                          |
| List all customers                          | `components/customer/src/ejb-jar.xml` 80-88, finder `findAllCustomers`, EJB-QL `Select OBJECT(a) From Customer a`. Its only caller is `CustomerPopulator.check`.                                                                                                                                                                                                                       |
| Contact info with existing address          | `components/contactinfo/.../ContactInfoEJB.java` 93-107. `ejbCreate` sets four CMP fields and `ejbPostCreate` calls `setAddress(address)`. Its only caller is `ContactInfoPopulator` line 94.                                                                                                                                                                                          |
| Separate datastores                         | `setup.xml` 199-227 registers the XA datasources `jdbc/petstore/PetStoreDB`, `jdbc/supplier/SupplierDB` and `jdbc/opc/OPCDB` on Cloudscape with `createDatabase=create`.                                                                                                                                                                                                               |
| Installation sequence                       | The `setup.xml` 229-257 `deploy` target runs `deploytool -generateSQL` and then `-deploy` for petstore, opc, supplier and petstoreadmin, in that order, and then echoes the `/petstore` URL. Table DDL is generated from CMP mappings at deploy time. No DDL is checked in.                                                                                                            |

## Findings

- **F1. EST-29 is stocked but not catalogued.** The supplier seed has 29 inventory lines (EST-1 to EST-29). The storefront catalog has 28 items, and EST-29 is the one with no catalog item. A diff of the item ids in the two seed files confirms this. Whether EST-29 is a deliberate orphan or a leftover is unknown, so it goes to the Business Owner.
- **F2. Two shapes of seed requirement.** The documentation passes (docs a/b/c) describe "one editable seed file". The code has two seed files, one per application, and also per-database SQL statement sets. The rebuild targets a single datastore, so the per-database selection is probably an implementation detail. That is why it is left out of the requirement text.
- **F3. Record key collision.** `DATA-REQ-0001` is used by three unrelated records (contactinfo/b, supplier/b, setup.xml/b). The recommendations file disambiguates them by module.

## Suspected legacy defects (for the defect register)

Each entry states what the code does. Whether it is intended is the Business Owner's decision.

- **D1. Unauthenticated destructive repopulation (high).** This applies to both applications. Any anonymous request with `forcefully=true` drops the catalog, resets the sample accounts and resets supplier stock to 10000. The "Population access without sign-on" requirement records this behaviour as observed.
- **D2. A failed check wipes the catalog (high, data-corruption).** In non-forced mode, an exception in the populated check is swallowed and leaves `alreadyPopulated=false`, so the catalog is dropped as if the run were forced (petstore `PopulateServlet` 152-160). The "Populated-state check" requirement records this.
- **D3. Unescaped parameter echo (medium).** Both `populating.jsp` pages write `request.getParameter("forcefully")` raw into the META refresh URL.
- **D4. Open redirect (medium).** `success_page` / `error_page` come from the caller. A `//host/...` value resolves to an absolute URL on another host.
- **D5. Double redirect on error (low).** After redirecting to `error_page`, `doPost` falls through and redirects again to the success page or Referer, on a response that is already committed.
- **D6. Absolute Referer mangled (low, supplier).** `redirect()` prefixes the context path to a Referer that is already absolute.

The redirect requirement deliberately specifies one destination per outcome and leaves out D5 and D6.

## Open questions

- **Q1.** Should forced repopulation exist in production, and if so, who may run it? (D1)
- **Q2.** Is the three-datastore split a business requirement or only a deployment choice? Nothing in the source says why. The XA datasources suggest distributed transactions across the stores.
- **Q3.** Must the sample sign-on ids and the "/petstore" path be kept as they are?
- **Q4.** Is ending the visitor's session on a no-op entry intended? The stated reason is specific to the legacy container.
