## Context

Legacy implementation notes for `customer-notifications`, extracted from `legacy-source/petstore1.3.2`. This document records how the LEGACY application implements the capability. It does not describe the replacement system; the target design is drafted separately once the Product Requirement is approved.

Source records: 25 pass-file entries across `components/mailer` (passes a, b), `components/servicelocator` (a, b), `setup.xml` (a, b) and `docs` (a, b, c). They reduce to 22 distinct record keys and 12 requirements in `specs/customer-notifications/spec.md`.

## User interface

No screen records were extracted for this capability; its user interface is unspecified. Customers only experience it as e-mail in their inbox. The legacy configuring guide describes enabling the e-mails through the J2EE SDK deployment tool, which is an operator procedure, not an application screen.

## Legacy structure

### Mail-delivery service (`components/mailer`)

- `MailerMDB` is a container-managed message-driven bean on a `javax.jms.Queue` (`mailer/src/ejb-jar.xml` 48-64), transaction attribute `Required` (71-80). The queue is bound to `jms/opc/MailQueue` in the opc app's `sun-j2ee-ri.xml`.
- `onMessage` (`MailerMDB.java` 74-90) casts to `TextMessage`, parses the text with `Mail.fromXML`, and calls `MailHelper.createAndSendMail(address, subject, content, Locale.getDefault())`.
- The request is an XML document validated against `Mail.dtd` (38-41): `<!ELEMENT Mail (Address, Subject, Content)>`, all `#PCDATA`. `Mail.fromXML` parses with validation on; `fromDOM` (154-165) reads the three children in order and fails if the root is not `<Mail>`. The DTD says nothing about empty values, so whether an empty address or subject is accepted is not established.
- `MailHelper.createAndSendMail` (70-89) looks up `java:comp/env/mail/MailSession`, builds a `MimeMessage`, calls `setFrom()` with no argument (sender comes from the session's `mail.from`), sets recipients from `InternetAddress.parse(addr, false)` as TO, content type `text/html`, header `X-Mailer: JavaMailer`, sent date now, then `Transport.send`.
- `ByteArrayDataSource` (64-69) encodes the body with `getBytes("UTF-8")`. The `text/html` content-type header carries no charset parameter, so the declared and actual encodings can disagree in a mail client.
- The `locale` parameter of `createAndSendMail` is never read; the `onMessage` javadoc (67-73) says content arrives already formatted.

### Error paths

- **Send failure** — `MailHelper` catches every `Exception`, prints to `System.err`, throws `MailerAppException`. `MailerMDB` catches it and does nothing; the `EJBException` rethrow is commented out with "ignore since user probably forgot to set up mail server". The transaction commits and the message is consumed: the e-mail is lost with no retry and no alert.
- **Malformed request** — `XMLDocumentException` and `JMSException` are rethrown as `EJBException`; a non-text message raises an uncaught `ClassCastException`. Under `Required` the receipt rolls back and the message returns to the queue. Redelivery limits and dead-letter handling are application-server configuration not present in the source, so a poison message may redeliver indefinitely.

### Notification producers (`apps/opc/.../customerrelations/ejb`)

| Notification                                    | Legacy bean             | Switch (env-entry, `java.lang.Boolean`) |
| ----------------------------------------------- | ----------------------- | --------------------------------------- |
| Order approval                                  | `MailOrderApprovalMDB`  | `param/SendApprovalMail`                |
| Fulfilment confirmation (invoice, per shipment) | `MailInvoiceMDB`        | `param/SendConfirmationMail`            |
| Order completion                                | `MailCompletedOrderMDB` | `param/SendCompletedOrderMail`          |

- `MailOrderApprovalMDB` initialises its flag to `false`, reads it in `ejbCreate`, and only works when true (127-130). The other two beans' gating was not read in the extraction passes.
- Locale-specific templates are applied by these producers (`MailContentXDE`, `LocaleUtil`), not by the mailer. Their wording and templates were not extracted in this capability's records.
- `setup.xml` (72-94, ant target `create_jms_queues`) creates `jms/opc/MailOrderApprovalQueue`, `jms/opc/MailCompletedOrderQueue` and `jms/opc/MailQueue` on `jms/opc/QueueConnectionFactory`. The role of each queue is inferred from its name. `MailInvoiceMDB` listens on a topic (`opc/src/ejb-jar.xml` ~412), not one of these queues.

### Configuration lookup (`components/servicelocator`)

- `ServiceLocator.getBoolean/getString/getUrl` (ejb variant 213-227, web variant 274-288) look up a `java:comp/env` entry and cast it, wrapping `NamingException` and `ClassCastException` in `ServiceLocatorException`. No default is substituted.
- `MailInvoiceMDB.ejbCreate` (94-106) and `MailCompletedOrderMDB.ejbCreate` (97-98) rethrow that as `EJBException`, so the bean is not created. Settings are not cached; the web-tier locator caches only homes, JMS factories/destinations and data sources.
- The mail session (`mail-from`, `mail-host`, account `name`) is configured in `opc/src/sun-j2ee-ri.xml`; shipped `mail-from` is `customerservice@javapetstoredemo.com` (line 404).

## Decisions and disputes

- **D1 Notification default is not stated in the spec.** `docs/configuring.html` 49-51 says the e-mails are disabled by default, while its own snippets (145, 151, 157) show `true` and tell the reader to "ensure" it is true. The deployed values in `opc/src/ejb-jar.xml` (417, 507, 593) are redacted. The spec requires independent switches and omits the default. The conflict goes to Intent for the Business Owner; the unredacted descriptor or a test deployment settles what production does.
- **D2 Silent discard is specified as current behaviour.** The code is unambiguous and both mailer passes agree. Whether losing a customer e-mail without retry or alert is acceptable is a Business Owner decision in the defect register.
- **D3 Duplicate records merged.** Passes a and b of each module produced near-identical records (`CN-*` vs `NOTIF-*`, the three `CUSTOMER-NOTIFICATIONS-REQ-0001` variants). Each pair became one requirement; the recommendation file maps them.
- **D4 Approval-denial e-mail.** Neither the docs nor the extracted records mention an e-mail when an order is denied. Nothing is specified for it; it is not known whether the legacy sends one.

## Requirement-to-record traceability

| Requirement                                | Records                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Asynchronous e-mail delivery               | CN-INT-0001, NOTIF-INT-0001 (mailer/b)                                                                   |
| Dedicated notification channels            | customer-notifications-INT-0001, NOTIF-INT-0001 (setup.xml/b)                                            |
| E-mail request format                      | CN-ENT-0001, NOTIF-ENT-0001                                                                              |
| E-mail message composition                 | CN-REQ-0001, NOTIF-RULE-0001                                                                             |
| Content delivered as supplied              | CN-REQ-0002, NOTIF-RULE-0004                                                                             |
| Recipient address list                     | CN-REQ-0003                                                                                              |
| Send failure handling                      | CN-BR-0001, NOTIF-RULE-0002                                                                              |
| Malformed request rejection                | CN-BR-0002, NOTIF-RULE-0003                                                                              |
| Order notification e-mails                 | CUSTOMER-NOTIFICATIONS-REQ-0001 (docs/b), CUSTOMER-NOTIFICATIONS-BR-0002, CUSTOMER-NOTIFICATIONS-WF-0001 |
| Independent notification switches          | CUSTOMER-NOTIFICATIONS-REQ-0001 (docs/a, docs/c), CUSTOMER-NOTIFICATIONS-BR-0001                         |
| Missing notification setting fails startup | CUSTNOTIF-BR-0001, NOTIFY-BUSINESS-RULE-0001                                                             |
| Configurable mail server and sender        | CUSTOMER-NOTIFICATIONS-REQ-0002, CUSTOMER-NOTIFICATIONS-INT-0001                                         |

## Risks / gaps

- The producers' message content (what each e-mail says) was not extracted; the rebuild has no wording to match.
- Redelivery behaviour for malformed requests depends on server configuration absent from the source.
- `NOTIFY-BUSINESS-RULE-0001` describes a locator used by other capabilities too (order approval, fulfilment XML-validation switches); only its notification use is specified here.
