# Design notes: how the legacy application implements localization

This file records how Java Pet Store 1.3.2 implements the `localization` capability. It does not propose a target design; the Architect drafts that after the Product Requirement is approved. All paths are relative to `legacy-source/petstore1.3.2/`.

## Sources read

IR pass files carrying `capability_key: localization`: `docs/{a,b,c}`, `src/apps/admin/{a,b}`, `src/apps/opc/{a,b}`, `src/apps/petstore/{a,b}`, `src/components/cart/a`, `src/components/catalog/{a,b}`, `src/components/encodingfilter/{a,b,c}`, `src/components/purchaseorder/{a,b}`, `src/components/xmldocuments/{a,b}`, `src/waf/{a,b}`. Many records are the same rule seen by different passes or from different modules; the spec states each rule once.

## Locale set and page sets

- `src/apps/petstore/src/docroot/WEB-INF/web.xml` (lines 96-117): TemplateServlet init-params `locales=en_US,ja_JP,zh_CN` and `default_locale=en_US`; MainServlet also gets `default_locale=en_US`.
- One screen-definition file per locale: `WEB-INF/screendefinitions_en_US.xml`, `_ja_JP.xml`, `_zh_CN.xml`, pointing at JSP copies in `docroot/`, `docroot/ja/`, `docroot/zh/`.
- **Documentation conflict (goes to Intent):** `docs/configuring.html` lines 205-207 say the storefront ships English and Japanese only. The Japanese and Chinese guides (`docs/ja/configuring.html` 166-167, `docs/zh/configuring.html` 161) list en/ja/zh, and the code ships zh_CN throughout (screen definitions, JSPs, seed data with 49 zh-CN detail rows). The spec follows the code; the Business Owner confirms zh_CN.

## Session locale and locale change

- `src/waf/.../controller/web/MainServlet.java` 79-81, 110-113: reads `default_locale` at start-up and writes it into session key `com.sun.j2ee.blueprints.waf.LOCALE` whenever that key is null.
- `src/waf/.../web/action/actions/ChangeLocaleHTMLAction.java` 70-84: reads request parameter `locale`, parses it, stores it in the session and returns a ChangeLocaleEvent; a null parse throws HTMLActionException("Unable to change language to " + value).
- `src/apps/petstore/.../ejb/actions/ChangeLocaleEJBAction.java` 59-67: copies the locale into the stateful shopping controller and calls `cart.setLocale(locale)`. `SignOnEJBAction.java` 89-91 does the same `cart.setLocale` at sign-on.
- Locale-code parsing exists in four near-identical copies: `waf/.../util/I18nUtil.getLocaleFromString` (159-196), `catalog/.../client/CatalogHelper.getLocaleFromString` (359-386), `xmldocuments/.../XMLDocumentUtils.getLocaleFromString` (644-678) and `opc/.../customerrelations/ejb/LocaleUtil.getLocaleFromString` (48-75).
  - Suspected defect in all four: the variant branch is dead (`variantIndex` is always -1), and with a three-part code the country stays null. The spec states only the two-part and `default` behaviour; the defect register decides whether variant parsing matters.

## Header language switch and return to page

- `src/apps/petstore/src/docroot/banner.jsp` 76-105: three `waf:client_cache_link` flag images (`us_flag.gif`, `ja_flag.gif`, `zh_flag.gif`) targeting `changelocale.do` with `locale=en_US|ja_JP|zh_CN`, with `encodeRequestParameters` and `encodeRequestAttributes` set.
- `src/apps/petstore/src/docroot/WEB-INF/mappings.xml` 101-104: `changelocale.do` uses ChangeLocaleHTMLAction with ClientStateFlowHandler.
- `ClientStateTag.java` 149-155 writes hidden fields `referring_screen`, `cacheId` and Base64-serialised request attributes (`<cacheId>_attribute_<name>`); `ClientStateFlowHandler.java` 66-74 restores them and returns `referring_screen` as the next screen.

## Change-language screen (LOC-SCR-0005)

- `src/waf/src/docroot/changelocale.jsp` 48-57: a form posting to `changelocale.do` with a `<select name="locale">` (en_US, de_DE, ja_JP, zh_CN) and a submit button.
- `src/waf/src/docroot/WEB-INF/mappings.xml` 48-50: on success forwards to `locale_change_success.screen`, rendered by `changelocalesuccess.jsp` 46-47, which prints the session LOCALE attribute.
- **Reachability unresolved:** these pages belong to the WAF framework's own sample web application, not to the Pet Store WAR. The Pet Store storefront uses the header flags instead. The WAF sample's `web.xml` lists only en_US in `locales`, so every option renders from the en_US page set there; de_DE has no page set anywhere. Whether the sample WAR is deployed in production settles whether this screen is in scope.

## Page locale resolution

- `src/waf/.../view/template/TemplateServlet.java` 157-166: locale from request parameter `locale`, else session LOCALE; if no screen set is loaded for it, use `default_locale`.
- Same file 231-252: if the screen is missing from the chosen locale's set, the default locale's set is tried; if still missing, an error "Definition for screen <name> not found" is shown.
- Screen sets are loaded from `/WEB-INF/screendefinitions_<locale>.xml` for each entry in `locales`.

## Catalog and prices

- `*_details` tables (`category_details`, `product_details`, `item_details`) carry a `locale char(10)` column in their primary key (`PopulateSQL.xml` 146-158); every catalog DAO query binds `locale.toString()` (e.g. `CloudscapeCatalogDAO.java` 166).
- `DatabaseNames.getTableName` (`catalog/.../util/DatabaseNames.java` 55-65) recognises exactly Locale.US, JAPAN and CHINA, but is unused.
- Seed data `populate/Populate-UTF8.xml` 552-577 gives per-locale prices (EST-1: 16.50/10.00 en-US, 1951/1551 ja-JP, 142/86 zh-CN). The ratios are not constant, so prices are stated, not converted. They are demo values.
- Each JSP copy hard-codes its locale: `docroot/cart.jsp` 47 and `item.jsp` 54 use en_US, `ja/cart.jsp` 49 ja_JP, `zh/cart.jsp` 49 zh_CN, for both the catalog lookup and `fmt:setLocale` currency formatting. The page set, not the session, decides the content locale on a given page; in practice they agree because the page set is chosen from the session locale.

## Cart

- `components/cart/.../ShoppingCartLocalEJB.java` 65-66: `locale` field initialised to `Locale.US` ("default to the US English"); 76-78 `setLocale`; 94 `getItems()` passes the locale to `CatalogHelper.getItem(key, locale)`. Cart totals are re-derived from the localized price (cart capability SC-BR-0004).

## Character encoding

- `components/encodingfilter/.../EncodingFilter.java` 57-78: `init()` sets `targetEncoding` from init-param `encoding`; `doFilter` calls `request.setCharacterEncoding(targetEncoding)` then continues the chain.
- Petstore `web.xml` 47-79: filter declared with `encoding=UTF-8` and mapped to `/*` before SignOnFilter (also `/*`), so decoding runs first. The ordering dependency of sign-on is inferred from servlet filter-order semantics; no comment states the intent.
- `apps/petstore/src/build.xml` 197-200 packages the filter into the petstore WAR.
- Responses: `template.jsp` 39 and `sidebar.jsp` declare `contentType="text/html;charset=UTF-8"`.
- **Suspected defect:** the field is initialised to "ASCII" with a "default to ASCII" comment, but `init()` overwrites it with a null when the init-param is absent, so `setCharacterEncoding(null)` is called and behaviour is container-dependent. The shipped configuration supplies UTF-8, so production does not hit this path. The spec therefore states only the configured behaviour.
- **Open question:** admin, supplier and OPC web applications do not declare this filter. Whether they need UTF-8 input decoding is for the Business Owner.

## Order, invoice and document encoding

- `components/purchaseorder/.../PurchaseOrder.java` 74: `locale = Locale.US`; 287-290 reads the `locale` attribute on parse; `PurchaseOrder.dtd` 40-42 declares `locale CDATA "en_US"`; `PurchaseOrderEJB.java` 202 stores `getLocale().toString()` into CMP field `poLocale`, 265 restores it.
- `xmldocuments/.../rsrc/schemas/TPAInvoice.dtd` 42-45: invoice `locale` attribute defaults to en_US; `TPAInvoiceXDE` never sets it and the XSD omits it, so DTD-validated invoices always read as en_US. No consumer of the invoice locale was traced.
- `XMLDocumentUtils.java` 56: `DEFAULT_ENCODING = "UTF-8"`, passed to the serializer (378-380) by OrderApproval.toXML and both TPA builders (e.g. `TPAInvoiceXDE.java` 134-142).

## Customer e-mails

- `opc/.../rsrc/xsl/PartialInvoice_<locale>.xsl` and `CompletedOrder_<locale>.xsl`: `format-number()` uses `$#,##0.00` for en_US and zh_CN and `￥#,##0` for ja_JP; locale-less base templates use the dollar pattern.
- MailOrderApprovalMDB (174) and MailInvoiceMDB parse `po.getPoLocale()` with LocaleUtil; MailCompletedOrderMDB uses `PurchaseOrder.getLocale()`. The template is selected per locale.
- Note: zh_CN e-mails show prices with a dollar sign although zh_CN catalog prices are stated in a different currency (142 vs 16.50). Recorded as found; whether that is intended is for the Business Owner.

## Administration client

- `apps/admin/src/client/.../PetStoreAdminClient.java` 254-277: ResourceBundle `resources.petstore`, chosen by the JVM default locale; `petstore.properties` (English) and `petstore_de.properties` (German). No ja_JP or zh_CN bundle. A missing key returns null after printing a stack trace. Admin web pages (JSP/HTML) are English-only literals.

## Unreached utilities

- `I18nUtil.formatCurrency`/`formatNumber` (100-112) and `parseKeywords` (136-157): a grep across `legacy-source` finds no caller outside `src/waf`. Recorded with `dispute: unresolved-reachability`. Both records (LOC-BR-0007, LOC-BR-0010) were nevertheless approved by an SME, so they are specified.

## Requirement-to-record map

Record keys repeat across pass files with different content. Each approved key is written from the pass file named below; the other same-key records, and every record not in the approved set, are Not specified and left out of `spec.md` (recommendations in `legacy-analysis/ir/_recommendations/localization.yaml`).

| Spec requirement                                        | ID           | Record (pass file the text is taken from)                   |
| ------------------------------------------------------- | ------------ | ----------------------------------------------------------- |
| Supported storefront locales and header language switch | SWHR2-R-0078 | LOC-REQ-0001 (petstore/a, confirmed by petstore/b)          |
| Locale change applies to session and cart               | SWHR2-R-0076 | LOC-BR-0002 (petstore/a)                                    |
| Locale code interpretation                              | SWHR2-R-0077 | LOC-BR-0003 (waf/a, waf/b, xmldocuments/b agree)            |
| Page locale resolution and fallback                     | SWHR2-R-0133 | LOC-BR-0004 (waf/a, waf/b agree)                            |
| Locale-aware money and number formatting                | SWHR2-R-0018 | LOC-BR-0007 (waf/b)                                         |
| Locale-aware formatting and keyword splitting           | SWHR2-R-0019 | LOC-BR-0010 (waf/a)                                         |
| Change-language screen                                  | SWHR2-R-0020 | LOC-SCR-0005 (waf/a, waf/b) — the one `kind: screen` record |
| Catalog shown in the shopper's locale                   | SWHR2-R-0079 | LOCALIZATION-BR-0002 (docs/c)                               |
| UTF-8 interpretation of submitted text                  | SWHR2-R-0134 | LOCALIZATION-REQ-0001 (encodingfilter/a)                    |
| Encoding established before sign-on                     | SWHR2-R-0080 | LOCALIZATION-RULE-0001 (encodingfilter/a)                   |
| Cart lines follow the cart locale                       | SWHR2-R-0081 | SC-BR-0006 (cart/a)                                         |

Legacy behaviour described in the sections above but not in `spec.md` (change-locale error message, return to originating page, separately stated per-locale prices, UTF-8 page rendering and documents, configurable request encoding, order and invoice locale defaults, e-mail price formats, admin text catalogue) comes from records that are not approved, or from same-key records whose other text was not the one written, and is Not specified until an SME approves it.
