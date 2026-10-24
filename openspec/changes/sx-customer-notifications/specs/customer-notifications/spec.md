## ADDED Requirements

### Requirement: Independently switchable order notifications

ID: SWHR2-R-0015
Recovered from: CUSTOMER-NOTIFICATIONS-REQ-0001
The system SHALL support three customer e-mail notifications, each independently switchable at deployment time: order approval, order confirmation (sent as parts of the order are fulfilled), and order completion. GIVEN a notification is disabled WHEN its triggering event occurs THEN no e-mail of that kind SHALL be sent.

#### Scenario: Only the approval notification is enabled

- **GIVEN** the approval notification is enabled and the confirmation and completion notifications are disabled
- **WHEN** an order is approved, partly fulfilled and then completely fulfilled
- **THEN** the customer receives the approval e-mail only

#### Scenario: A disabled notification's event occurs

- **GIVEN** the completion notification is disabled
- **WHEN** an order is completely fulfilled
- **THEN** no completion e-mail is sent

### Requirement: Order notifications disabled unless enabled at deployment

ID: SWHR2-R-0014
Recovered from: CUSTOMER-NOTIFICATIONS-BR-0001
The system SHALL allow each of the three order notifications (approval, shipment / invoice confirmation, order completion) to be enabled or disabled independently by configuration, and SHALL have them disabled unless enabled at deployment.

#### Scenario: No notification is enabled at deployment

- **GIVEN** a deployment that enables none of the three order notifications
- **WHEN** an order is approved and then completely fulfilled
- **THEN** the customer receives no approval, confirmation or completion e-mail

#### Scenario: One notification is enabled at deployment

- **GIVEN** a deployment that enables the confirmation notification only
- **WHEN** part of an order is fulfilled
- **THEN** the customer receives a confirmation e-mail, and the approval and completion notifications remain disabled

### Requirement: Recipient address list

ID: SWHR2-R-0016
Recovered from: CN-REQ-0003
The system SHALL interpret the request's recipient address as a list of one or more e-mail addresses, parsed leniently, and send the e-mail to every address in it as a direct ("To") recipient.

#### Scenario: Two recipients in one request

- **GIVEN** an e-mail request whose recipient address is "a@example.com, b@example.com"
- **WHEN** the e-mail is sent
- **THEN** both addresses receive the e-mail as direct ("To") recipients

#### Scenario: Single recipient

- **GIVEN** an e-mail request whose recipient address is "a@example.com"
- **WHEN** the e-mail is sent
- **THEN** a@example.com receives the e-mail as a direct ("To") recipient

### Requirement: Configurable mail server and sender

ID: SWHR2-R-0017
Recovered from: CUSTOMER-NOTIFICATIONS-REQ-0002
The system SHALL send customer notification e-mails through a configurable mail server, with a configurable sender (From:) address; the shipped sender address is customerservice@javapetstoredemo.com.

#### Scenario: Shipped sender address

- **GIVEN** a deployment that keeps the shipped mail configuration
- **WHEN** a notification e-mail is sent
- **THEN** its From address is customerservice@javapetstoredemo.com

#### Scenario: Operator changes the mail server and sender

- **GIVEN** the operator configures mail host smtp.example.com and sender orders@example.com
- **WHEN** a notification e-mail is sent
- **THEN** it is delivered through smtp.example.com with From address orders@example.com

### Requirement: E-mail request format

ID: SWHR2-R-0130
Recovered from: CN-ENT-0001
The system SHALL define an e-mail request as exactly three text values, in this order: recipient address, subject, and content; all three SHALL be present for the request to be accepted.

#### Scenario: Complete request is accepted

- **GIVEN** an e-mail request carrying a recipient address, a subject and content
- **WHEN** the mail service receives it
- **THEN** the request is accepted for sending

#### Scenario: Request missing its subject is rejected

- **GIVEN** an e-mail request carrying a recipient address and content but no subject
- **WHEN** the mail service receives it
- **THEN** the request is rejected and no e-mail is sent

### Requirement: Asynchronous e-mail delivery from a queue

ID: SWHR2-R-0062
Recovered from: CN-INT-0001
The system SHALL accept outbound e-mail requests asynchronously from a message queue and, for each request, send one e-mail to the address named in the request using the subject and content carried in the request.

#### Scenario: One request produces one e-mail

- **GIVEN** an e-mail request for "a@example.com" with subject "Order Status: 1001" is placed on the mail queue
- **WHEN** the mail service consumes the request
- **THEN** exactly one e-mail with subject "Order Status: 1001" and the request's content is sent to a@example.com

#### Scenario: Producer does not wait for delivery

- **GIVEN** an order-processing step that needs to notify a customer
- **WHEN** it places an e-mail request on the mail queue
- **THEN** the step completes without waiting for the e-mail to be sent

### Requirement: Content sent as supplied

ID: SWHR2-R-0131
Recovered from: CN-REQ-0002
The system SHALL send the e-mail content exactly as supplied in the request, without applying any template, formatting or localisation in the mail service; any presentation and language choice SHALL already be applied by the producer of the request.

#### Scenario: Pre-formatted content is delivered unchanged

- **GIVEN** an e-mail request whose content is a Japanese-language HTML body
- **WHEN** the mail service sends it on a server whose default locale is English
- **THEN** the e-mail body is the supplied Japanese HTML, unchanged

### Requirement: Completed-order e-mail content

ID: SWHR2-R-0132
Recovered from: CNOT-REQ-0003
WHEN completed-order mail is enabled AND an order becomes COMPLETED, the system SHALL e-mail the order's e-mail address a message with subject 'Java Pet Store Order COMPLETED: <order id>' stating that the entire order has shipped and listing every line of the order (category, product, quantity, unit price), rendered in the order's locale.

#### Scenario: Order completes with completed-order mail enabled

- **GIVEN** completed-order mail is enabled and order 1001, placed in locale en_US with two lines, has all its lines shipped
- **WHEN** the order becomes COMPLETED
- **THEN** the order's e-mail address receives an English e-mail with subject "Java Pet Store Order COMPLETED: 1001" stating the entire order has shipped and listing both lines with category, product, quantity and unit price

#### Scenario: Order completes with completed-order mail disabled

- **GIVEN** completed-order mail is disabled
- **WHEN** an order becomes COMPLETED
- **THEN** no completed-order e-mail is sent

### Requirement: Per-notification deployment switch consumes the trigger

ID: SWHR2-R-0063
Recovered from: CNOT-REQ-0006
The system SHALL allow each of the three customer notifications (approval/denial, shipment, order completed) to be switched on or off independently by deployment configuration; WHEN a notification is switched off, the triggering message SHALL be consumed without sending mail.

#### Scenario: Shipment notification switched off

- **GIVEN** the shipment notification is switched off and the other two are switched on
- **WHEN** a supplier invoice for part of an order is received
- **THEN** the triggering message is consumed, no shipment e-mail is sent, and it is not redelivered

#### Scenario: Switching one notification does not affect the others

- **GIVEN** the approval notification is switched off and the completed-order notification is switched on
- **WHEN** an order is approved and later completed
- **THEN** only the completed-order e-mail is sent

### Requirement: Customer e-mail sequence for an order

ID: SWHR2-R-0064
Recovered from: CUSTOMER-NOTIFICATIONS-BR-0002
WHEN notifications are enabled, the system SHALL send the customer one e-mail when the order is approved, one or more e-mails as parts of the order are fulfilled, and one final e-mail when the order is completely fulfilled.

#### Scenario: Order fulfilled in two shipments

- **GIVEN** notifications are enabled and an order will be fulfilled in two shipments
- **WHEN** the order is approved and both shipments are fulfilled
- **THEN** the customer receives one approval e-mail, at least one e-mail for the fulfilled parts, and one final completion e-mail

### Requirement: Configurable mail server account

ID: SWHR2-R-0065
Recovered from: CUSTOMER-NOTIFICATIONS-INT-0001
The system SHALL send customer notification e-mails through a configurable outgoing mail server, using a configurable sender address and mail-server account.

#### Scenario: Operator sets the mail-server account

- **GIVEN** the operator configures the outgoing mail server, a sender address and a mail-server account name
- **WHEN** a customer notification e-mail is sent
- **THEN** it is sent through that server, using that account, from that sender address

### Requirement: Notification sequence on enabled notifications

ID: SWHR2-R-0066
Recovered from: CUSTOMER-NOTIFICATIONS-WF-0001
WHEN notifications are enabled THEN the system SHALL e-mail the customer once when the order is approved, once or more as parts of the order are fulfilled, and one final time when the order is completely fulfilled.

#### Scenario: Order fulfilled in a single shipment

- **GIVEN** notifications are enabled and an order is fulfilled in one shipment
- **WHEN** the order is approved and then completely fulfilled
- **THEN** the customer is e-mailed once on approval, at least once for the fulfilled part, and one final time on completion

### Requirement: Separate durable notification channels

ID: SWHR2-R-0067
Recovered from: customer-notifications-INT-0001
The system SHALL provide separate asynchronous, durable channels for order-approval e-mails, completed-order e-mails, and outbound mail delivery.

#### Scenario: Mail server unavailable

- **GIVEN** the outgoing mail server is slow or unavailable
- **WHEN** an order is approved
- **THEN** the approval notification is queued on its own channel and order processing continues without waiting for mail delivery

#### Scenario: Channels are distinct

- **GIVEN** an installed system
- **WHEN** an order-approval notification and a completed-order notification are produced
- **THEN** each is placed on its own channel, separate from the outbound mail-delivery channel
