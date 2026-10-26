-- EXTRACTED FROM LEGACY SOURCE — evidence of what exists, not a build target. Where this disagrees with a capability delta spec, the delta spec wins.
--
-- Java Pet Store 1.3.2: the relational schema the legacy application creates, read from
-- spec extraction SX-0001 (branch vortex/legacy-spec/sx-0001). It is NOT the rebuild's data
-- model. The rebuild's datastore is SQLite via Drizzle (db/ schema, drizzle/ migrations) and is
-- designed from the capability delta specs under openspec/changes/sx-*/specs/, not from this file.
--
-- Where the DDL comes from
--   * Catalog tables: hand-written DDL in
--     legacy-source/petstore1.3.2/src/apps/petstore/src/docroot/populate/PopulateSQL.xml
--     (cloudscape block lines 45-171; an oracle block at lines 173-300 is identical except
--     char(n) becomes varchar(n)). The cloudscape variant is reproduced below.
--   * Every other table: container-generated CMP 2.0 DDL in the deployment descriptors
--     legacy-source/petstore1.3.2/src/apps/{petstore,opc,supplier}/src/sun-j2ee-ri.xml
--     (<operation>createTable</operation>). Column names and types are copied verbatim.
--     LONGINT is the reference implementation's 64-bit integer type.
--   * Relationships between CMP tables are NOT declared as foreign keys in the generated DDL.
--     They are container-managed relationships (CMR) declared in each component's ejb-jar.xml
--     <ejb-relation> elements, all one-to-one or one-to-many with cascade-delete. They are
--     recorded below as comments, never as constraints, because the legacy database has none.
--
-- Three separate datasources. Table names repeat across them (AddressEJBTable,
-- ContactInfoEJBTable, CreditCardEJBTable, LineItemEJBTable), so each table below is
-- qualified with the datasource it lives in:
--   petstoredb  = jdbc/petstore/PetStoreDB  (storefront: catalog, customers, sign-on, id counter)
--   opcdb       = jdbc/opc/OPCDB            (order processing centre: purchase orders, workflow)
--   supplierdb  = jdbc/supplier/SupplierDB  (supplier: supplier orders, inventory)
-- No table is shared between datasources. Data moves between them only as XML documents over
-- JMS queues (see api/openapi.yaml, x-legacy-messaging).
--
-- Not persisted at all: the shopping cart (stateful session bean, in memory only) and the
-- user profile's session state. See openspec/changes/sx-shopping-cart/design.md.


-- =====================================================================================
-- petstoredb : catalog (PopulateSQL.xml, cloudscape block)
-- Locale-scoped catalog: a row in *_details exists per (id, locale). No locale fallback.
-- Locale values seen in the seed data: en_US, ja_JP, zh_CN.
-- =====================================================================================

-- PopulateSQL.xml lines 51-52
CREATE TABLE petstoredb.category (
  catid char(10) NOT NULL,
  CONSTRAINT pk_category PRIMARY KEY (catid)
);

-- PopulateSQL.xml lines 66-71
CREATE TABLE petstoredb.category_details (
  catid  char(10)     NOT NULL,
  name   varchar(80)  NOT NULL,
  image  varchar(255) NULL,
  descn  varchar(255) NULL,
  locale char(10)     NOT NULL,
  CONSTRAINT pk_category_details PRIMARY KEY (catid, locale),
  CONSTRAINT fk_category_details_1 FOREIGN KEY (catid) REFERENCES petstoredb.category (catid)
);

-- PopulateSQL.xml lines 85-90
CREATE TABLE petstoredb.product (
  productid char(10) NOT NULL,
  catid     char(10) NOT NULL,
  CONSTRAINT pk_product PRIMARY KEY (productid),
  CONSTRAINT fk_product_1 FOREIGN KEY (catid) REFERENCES petstoredb.category (catid)
);

-- PopulateSQL.xml lines 104-112
CREATE TABLE petstoredb.product_details (
  productid char(10)     NOT NULL,
  locale    char(10)     NOT NULL,
  name      varchar(80)  NOT NULL,
  image     varchar(255) NULL,
  descn     varchar(255) NULL,
  CONSTRAINT pk_product_details PRIMARY KEY (productid, locale),
  CONSTRAINT fk_product_details_1 FOREIGN KEY (productid) REFERENCES petstoredb.product (productid)
);

-- PopulateSQL.xml lines 126-132
CREATE TABLE petstoredb.item (
  itemid    char(10) NOT NULL,
  productid char(10) NOT NULL,
  CONSTRAINT pk_item PRIMARY KEY (itemid),
  CONSTRAINT fk_item_1 FOREIGN KEY (productid) REFERENCES petstoredb.product (productid)
);

-- PopulateSQL.xml lines 146-162
-- listprice is what the cart and order charge; unitcost is carried but not charged.
-- Prices are stated separately per locale; there is no currency conversion.
CREATE TABLE petstoredb.item_details (
  itemid    char(10)       NOT NULL,
  listprice decimal(10,2)  NOT NULL,
  unitcost  decimal(10,2)  NOT NULL,
  locale    char(10)       NOT NULL,
  image     char(255)      NOT NULL,
  descn     varchar(255)   NOT NULL,
  attr1     varchar(80)    NULL,
  attr2     varchar(80)    NULL,
  attr3     varchar(80)    NULL,
  attr4     varchar(80)    NULL,
  attr5     varchar(80)    NULL,
  CONSTRAINT pk_item_details PRIMARY KEY (itemid, locale),
  CONSTRAINT fk_item_details_1 FOREIGN KEY (itemid) REFERENCES petstoredb.item (itemid)
);


-- =====================================================================================
-- petstoredb : sign-on, customer, id counter (apps/petstore/src/sun-j2ee-ri.xml)
-- CMR (components/customer/src/ejb-jar.xml), all One-to-One, cascade-delete on the child:
--   CustomerEJB.account      -> AccountEJB      (AccountEJBTable.__reverse_account_userId = CustomerEJBTable.userId)
--   CustomerEJB.profile      -> ProfileEJB      (ProfileEJBTable.__reverse_profile_userId = CustomerEJBTable.userId)
--   AccountEJB.contactInfo   -> ContactInfoEJB  (AccountEJBTable._contactInfo___PMPrimaryKey)
--   AccountEJB.creditCard    -> CreditCardEJB   (AccountEJBTable._creditCard___PMPrimaryKey)
--   ContactInfoEJB.address   -> AddressEJB      (ContactInfoEJBTable._address___PMPrimaryKey)
-- UserEJBTable (sign-on credentials) is keyed by userName and is linked to CustomerEJBTable only
-- by equal user id values; no CMR joins them.
-- =====================================================================================

-- sun-j2ee-ri.xml line 418. Password stored as plain text.
CREATE TABLE petstoredb."UserEJBTable" (
  "password" VARCHAR(255),
  "userName" VARCHAR(255),
  CONSTRAINT "pk_UserEJBTabl" PRIMARY KEY ("userName")
);

-- sun-j2ee-ri.xml line 308
CREATE TABLE petstoredb."CustomerEJBTable" (
  "_account___PMPrimaryKey" LONGINT,
  "_profile___PMPrimaryKey" LONGINT,
  "userId" VARCHAR(255),
  CONSTRAINT "pk_CustomerEJBTabl" PRIMARY KEY ("userId")
);

-- sun-j2ee-ri.xml line 267
CREATE TABLE petstoredb."AccountEJBTable" (
  "__PMPrimaryKey" LONGINT,
  "__reverse_account_userId" VARCHAR(255),
  "_contactInfo___PMPrimaryKey" LONGINT,
  "_creditCard___PMPrimaryKey" LONGINT,
  "status" VARCHAR(255),
  CONSTRAINT "pk_AccountEJBTabl" PRIMARY KEY ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml line 354
CREATE TABLE petstoredb."ProfileEJBTable" (
  "__PMPrimaryKey" LONGINT,
  "__reverse_profile_userId" VARCHAR(255),
  "bannerPreference" BOOLEAN NOT NULL,
  "favoriteCategory" VARCHAR(255),
  "myListPreference" BOOLEAN NOT NULL,
  "preferredLanguage" VARCHAR(255),
  CONSTRAINT "pk_ProfileEJBTabl" PRIMARY KEY ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml line 222
CREATE TABLE petstoredb."ContactInfoEJBTable" (
  "__PMPrimaryKey" LONGINT,
  "__reverse_contactInfo___PMPrimaryKey" LONGINT,
  "_address___PMPrimaryKey" LONGINT,
  "email" VARCHAR(255),
  "familyName" VARCHAR(255),
  "givenName" VARCHAR(255),
  "telephone" VARCHAR(255),
  CONSTRAINT "pk_ContactInfoEJBTabl" PRIMARY KEY ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml line 165
CREATE TABLE petstoredb."AddressEJBTable" (
  "__PMPrimaryKey" LONGINT,
  "__reverse_address___PMPrimaryKey" LONGINT,
  "city" VARCHAR(255),
  "country" VARCHAR(255),
  "state" VARCHAR(255),
  "streetName1" VARCHAR(255),
  "streetName2" VARCHAR(255),
  "zipCode" VARCHAR(255),
  CONSTRAINT "pk_AddressEJBTabl" PRIMARY KEY ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml line 112. Card number stored in full, unmasked; no format check.
CREATE TABLE petstoredb."CreditCardEJBTable" (
  "__PMPrimaryKey" LONGINT,
  "__reverse_creditCard___PMPrimaryKey" LONGINT,
  "cardNumber" VARCHAR(255),
  "cardType" VARCHAR(255),
  "expiryDate" VARCHAR(255),
  CONSTRAINT "pk_CreditCardEJBTabl" PRIMARY KEY ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml line 629. Unique id generator (components/uidgen). getNextValue()
-- increments "counter" and returns name || counter; orders use name "1001", so the first
-- order id is "10011" (OrderEJBAction.java line 110, CounterEJB.java lines 57-71).
CREATE TABLE petstoredb."CounterEJBTable" (
  "counter" INTEGER NOT NULL,
  "name" VARCHAR(255),
  CONSTRAINT "pk_CounterEJBTabl" PRIMARY KEY ("name")
);


-- =====================================================================================
-- opcdb : order processing centre (apps/opc/src/sun-j2ee-ri.xml)
-- CMR (components/purchaseorder/src/ejb-jar.xml), cascade-delete on the child:
--   PurchaseOrderEJB.contactInfo -> ContactInfoEJB  One-to-One  (PurchaseOrderEJBTable._contactInfo___PMPrimaryKey)
--   PurchaseOrderEJB.creditCard  -> CreditCardEJB   One-to-One  (PurchaseOrderEJBTable._creditCard___PMPrimaryKey)
--   PurchaseOrderEJB.lineItems   -> LineItemEJB     One-to-Many (join table PurchaseOrderEJB_lineItems_LineItemEJB_Table)
--   ContactInfoEJB.address       -> AddressEJB      One-to-One
-- ManagerEJBTable (process manager) shares the order id with PurchaseOrderEJBTable by value only.
-- =====================================================================================

-- sun-j2ee-ri.xml line 653. poDate is epoch milliseconds; poValue is a float total.
CREATE TABLE opcdb."PurchaseOrderEJBTable" (
  "_contactInfo___PMPrimaryKey" LONGINT,
  "_creditCard___PMPrimaryKey" LONGINT,
  "poDate" LONGINT NOT NULL,
  "poEmailId" VARCHAR(255),
  "poId" VARCHAR(255),
  "poLocale" VARCHAR(255),
  "poUserId" VARCHAR(255),
  "poValue" REAL NOT NULL,
  CONSTRAINT "pk_PurchaseOrderEJBTabl" PRIMARY KEY ("poId")
);

-- sun-j2ee-ri.xml line 471. Order workflow status. Values (processmanager
-- OrderStatusNames.java lines 51-65): PENDING, APPROVED, DENIED, SHIPPED_PART, COMPLETED.
CREATE TABLE opcdb."ManagerEJBTable" (
  "orderId" VARCHAR(255),
  "status" VARCHAR(255),
  CONSTRAINT "pk_ManagerEJBTabl" PRIMARY KEY ("orderId")
);

-- sun-j2ee-ri.xml line 702
CREATE TABLE opcdb."LineItemEJBTable" (
  "__PMPrimaryKey" LONGINT,
  "categoryId" VARCHAR(255),
  "itemId" VARCHAR(255),
  "lineNumber" VARCHAR(255),
  "productId" VARCHAR(255),
  "quantity" INTEGER NOT NULL,
  "quantityShipped" INTEGER NOT NULL,
  "unitPrice" REAL NOT NULL,
  CONSTRAINT "pk_LineItemEJBTabl" PRIMARY KEY ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml line 779. One-to-many join: each line item belongs to one purchase order.
CREATE TABLE opcdb."PurchaseOrderEJB_lineItems_LineItemEJB_Table" (
  "_LineItemEJB___PMPrimaryKey" LONGINT,
  "_PurchaseOrderEJB_poId" VARCHAR(255),
  CONSTRAINT "pk_PurchaseOrderEJB_lineItems_LineItemEJB_Tabl" PRIMARY KEY ("_LineItemEJB___PMPrimaryKey")
);

-- sun-j2ee-ri.xml line 567
CREATE TABLE opcdb."ContactInfoEJBTable" (
  "__PMPrimaryKey" LONGINT,
  "__reverse_contactInfo_poId" VARCHAR(255),
  "_address___PMPrimaryKey" LONGINT,
  "email" VARCHAR(255),
  "familyName" VARCHAR(255),
  "givenName" VARCHAR(255),
  "telephone" VARCHAR(255),
  CONSTRAINT "pk_ContactInfoEJBTabl" PRIMARY KEY ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml line 604
CREATE TABLE opcdb."AddressEJBTable" (
  "__PMPrimaryKey" LONGINT,
  "__reverse_address___PMPrimaryKey" LONGINT,
  "city" VARCHAR(255),
  "country" VARCHAR(255),
  "state" VARCHAR(255),
  "streetName1" VARCHAR(255),
  "streetName2" VARCHAR(255),
  "zipCode" VARCHAR(255),
  CONSTRAINT "pk_AddressEJBTabl" PRIMARY KEY ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml line 739. A per-order copy of the card; the storefront attaches a fixed
-- card to every order (see openspec/changes/sx-checkout, "Fixed payment card on every order").
CREATE TABLE opcdb."CreditCardEJBTable" (
  "__PMPrimaryKey" LONGINT,
  "__reverse_creditCard_poId" VARCHAR(255),
  "cardNumber" VARCHAR(255),
  "cardType" VARCHAR(255),
  "expiryDate" VARCHAR(255),
  CONSTRAINT "pk_CreditCardEJBTabl" PRIMARY KEY ("__PMPrimaryKey")
);


-- =====================================================================================
-- supplierdb : supplier (apps/supplier/src/sun-j2ee-ri.xml)
-- CMR (components/supplierpo/src/ejb-jar.xml), cascade-delete on the child:
--   SupplierOrderEJB.contactInfo -> ContactInfoEJB  One-to-One  (SupplierOrderEJBTable._contactInfo___PMPrimaryKey)
--   SupplierOrderEJB.lineItems   -> LineItemEJB     One-to-Many (join table SupplierOrderEJB_lineItems_LineItemEJB_Table)
--   ContactInfoEJB.address       -> AddressEJB      One-to-One
-- InventoryEJBTable is joined to line items by itemId value only.
-- =====================================================================================

-- sun-j2ee-ri.xml line 189. poStatus values (supplierpo OrderStatusNames.java lines 51-60):
-- PENDING, APPROVED, DENIED, COMPLETED.
CREATE TABLE supplierdb."SupplierOrderEJBTable" (
  "_contactInfo___PMPrimaryKey" LONGINT,
  "poDate" LONGINT NOT NULL,
  "poId" VARCHAR(255),
  "poStatus" VARCHAR(255),
  CONSTRAINT "pk_SupplierOrderEJBTabl" PRIMARY KEY ("poId")
);

-- sun-j2ee-ri.xml line 107
CREATE TABLE supplierdb."LineItemEJBTable" (
  "__PMPrimaryKey" LONGINT,
  "categoryId" VARCHAR(255),
  "itemId" VARCHAR(255),
  "lineNumber" VARCHAR(255),
  "productId" VARCHAR(255),
  "quantity" INTEGER NOT NULL,
  "quantityShipped" INTEGER NOT NULL,
  "unitPrice" REAL NOT NULL,
  CONSTRAINT "pk_LineItemEJBTabl" PRIMARY KEY ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml line 280
CREATE TABLE supplierdb."SupplierOrderEJB_lineItems_LineItemEJB_Table" (
  "_LineItemEJB___PMPrimaryKey" LONGINT,
  "_SupplierOrderEJB_poId" VARCHAR(255),
  CONSTRAINT "pk_SupplierOrderEJB_lineItems_LineItemEJB_Tabl" PRIMARY KEY ("_LineItemEJB___PMPrimaryKey")
);

-- sun-j2ee-ri.xml line 241
CREATE TABLE supplierdb."ContactInfoEJBTable" (
  "__PMPrimaryKey" LONGINT,
  "__reverse_contactInfo_poId" VARCHAR(255),
  "_address___PMPrimaryKey" LONGINT,
  "email" VARCHAR(255),
  "familyName" VARCHAR(255),
  "givenName" VARCHAR(255),
  "telephone" VARCHAR(255),
  CONSTRAINT "pk_ContactInfoEJBTabl" PRIMARY KEY ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml line 144
CREATE TABLE supplierdb."AddressEJBTable" (
  "__PMPrimaryKey" LONGINT,
  "__reverse_address___PMPrimaryKey" LONGINT,
  "city" VARCHAR(255),
  "country" VARCHAR(255),
  "state" VARCHAR(255),
  "streetName1" VARCHAR(255),
  "streetName2" VARCHAR(255),
  "zipCode" VARCHAR(255),
  CONSTRAINT "pk_AddressEJBTabl" PRIMARY KEY ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml line 396. One stock row per item; seeded at 10000 per item by data population.
CREATE TABLE supplierdb."InventoryEJBTable" (
  "itemId" VARCHAR(255),
  "quantity" INTEGER NOT NULL,
  CONSTRAINT "pk_InventoryEJBTabl" PRIMARY KEY ("itemId")
);
