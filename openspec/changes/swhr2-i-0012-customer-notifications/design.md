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

- **D1 Notification default is disputed.** `docs/configuring.html` 49-51 says the e-mails are disabled by default, while its own snippets (145, 151, 157) show `true` and tell the reader to "ensure" it is true. The deployed values in `opc/src/ejb-jar.xml` (417, 507, 593) are redacted. The approved record CUSTOMER-NOTIFICATIONS-BR-0001 states the documented default (disabled unless enabled at deployment), so the spec carries it; the conflict still goes to Intent for the Business Owner, and the unredacted descriptor or a test deployment settles what production does.
- **D2 Silent discard is specified as current behaviour.** The code is unambiguous and both mailer passes agree. Whether losing a customer e-mail without retry or alert is acceptable is a Business Owner decision in the defect register.
- **D3 Only approved records are specified.** `spec.md` carries the thirteen records an SME approved or that were accepted by rule (table below). The other records of this capability (message composition, send-failure discard, malformed-request rollback, approval/denial and shipment e-mail content, locale template selection, price formatting, missing-switch startup failure) are pending review and are Not specified; the legacy notes above still describe them, and `legacy-analysis/ir/_recommendations/customer-notifications.yaml` carries a recommendation for each.
- **D4 Approval-denial e-mail.** The docs mention only an approval e-mail. The pending record CNOT-REQ-0001 reads the code as sending one status e-mail for an approval or a denial; until it is approved, the spec says nothing about a denial e-mail.
- **D5 Overlapping approved records.** CUSTOMER-NOTIFICATIONS-BR-0002 and CUSTOMER-NOTIFICATIONS-WF-0001 restate the same documented e-mail sequence, CNOT-REQ-0006 overlaps CUSTOMER-NOTIFICATIONS-REQ-0001, and CUSTOMER-NOTIFICATIONS-INT-0001 overlaps CUSTOMER-NOTIFICATIONS-REQ-0002. Each approval minted its own key, so each one is a separate requirement; an implementation that satisfies one satisfies its pair.

## Requirement-to-record traceability

| Requirement                                               | ID           | Record                          |
| --------------------------------------------------------- | ------------ | ------------------------------- |
| Independently switchable order notifications              | SWHR2-R-0015 | CUSTOMER-NOTIFICATIONS-REQ-0001 |
| Order notifications disabled unless enabled at deployment | SWHR2-R-0014 | CUSTOMER-NOTIFICATIONS-BR-0001  |
| Recipient address list                                    | SWHR2-R-0016 | CN-REQ-0003                     |
| Configurable mail server and sender                       | SWHR2-R-0017 | CUSTOMER-NOTIFICATIONS-REQ-0002 |
| E-mail request format                                     | SWHR2-R-0130 | CN-ENT-0001                     |
| Asynchronous e-mail delivery from a queue                 | SWHR2-R-0062 | CN-INT-0001                     |
| Content sent as supplied                                  | SWHR2-R-0131 | CN-REQ-0002                     |
| Completed-order e-mail content                            | SWHR2-R-0132 | CNOT-REQ-0003                   |
| Per-notification deployment switch consumes the trigger   | SWHR2-R-0063 | CNOT-REQ-0006                   |
| Customer e-mail sequence for an order                     | SWHR2-R-0064 | CUSTOMER-NOTIFICATIONS-BR-0002  |
| Configurable mail server account                          | SWHR2-R-0065 | CUSTOMER-NOTIFICATIONS-INT-0001 |
| Notification sequence on enabled notifications            | SWHR2-R-0066 | CUSTOMER-NOTIFICATIONS-WF-0001  |
| Separate durable notification channels                    | SWHR2-R-0067 | customer-notifications-INT-0001 |

## Risks / gaps

- Only the completed-order e-mail's content is specified (CNOT-REQ-0003). The approval/denial and shipment e-mail content, locale template selection and price formatting were extracted (CNOT-REQ-0001, CNOT-REQ-0002, CNOT-RULE-0004, CNOT-RULE-0005) but are pending review.
- Redelivery behaviour for malformed requests depends on server configuration absent from the source.
- `NOTIFY-BUSINESS-RULE-0001` describes a locator used by other capabilities too (order approval, fulfilment XML-validation switches); only its notification use is specified here.
