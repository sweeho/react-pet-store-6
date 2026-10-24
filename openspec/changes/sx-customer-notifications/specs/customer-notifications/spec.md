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
