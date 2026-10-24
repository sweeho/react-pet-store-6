## ADDED Requirements

### Requirement: Asynchronous e-mail delivery

The system SHALL accept outbound customer e-mail requests as queued messages and SHALL send them from a separate mail-delivery service that consumes the queue, sending exactly one e-mail per accepted request, so that the requesting process never waits for the mail server.

#### Scenario: A queued request is delivered

- **GIVEN** a well-formed e-mail request carrying a recipient address, a subject and content
- **WHEN** the request is placed on the outbound mail queue
- **THEN** the mail-delivery service consumes it and sends one e-mail to that recipient with that subject and content

#### Scenario: The requester does not wait for delivery

- **GIVEN** the mail server is slow to respond
- **WHEN** order processing places an e-mail request on the queue
- **THEN** order processing continues without waiting for the e-mail to be sent

### Requirement: Dedicated notification channels

The system SHALL provide separate durable asynchronous channels for order-approval notifications, completed-order notifications, and general outbound mail delivery.

#### Scenario: Channels exist after installation

- **GIVEN** a fresh installation of the store
- **WHEN** installation completes
- **THEN** an order-approval mail channel, a completed-order mail channel and an outbound mail-delivery channel all exist and accept messages

### Requirement: E-mail request format

The system SHALL define an e-mail request as exactly three text values in this order: recipient address, subject, and content, and MUST require all three to be present for the request to be accepted.

#### Scenario: Complete request accepted

- **GIVEN** an e-mail request with a recipient address, a subject and content in that order
- **WHEN** the mail-delivery service reads it
- **THEN** the request is accepted for sending

#### Scenario: Request missing the subject

- **GIVEN** an e-mail request carrying a recipient address and content but no subject
- **WHEN** the mail-delivery service reads it
- **THEN** the request is rejected and no e-mail is sent

### Requirement: E-mail message composition

The system SHALL send each e-mail as an HTML message whose body is encoded in UTF-8, with the sender address taken from the central mail-service configuration rather than from the request, and the sent date set to the time of sending.

#### Scenario: Message properties on send

- **GIVEN** an accepted e-mail request whose content contains non-ASCII characters
- **WHEN** the e-mail is sent
- **THEN** the message is HTML, the body bytes are UTF-8 and render the characters unchanged, the From address is the configured sender, and the sent date is the time of sending

#### Scenario: Request cannot choose the sender

- **GIVEN** the configured sender address is customerservice@javapetstoredemo.com
- **WHEN** any e-mail request is sent
- **THEN** the e-mail's From address is customerservice@javapetstoredemo.com

### Requirement: Content delivered as supplied

The mail-delivery service SHALL send the request's content as the e-mail body unchanged, and MUST NOT apply any template, formatting, translation or recipient-locale selection; wording, layout and language SHALL be decided by the producer of the request.

#### Scenario: Content is not localised by the mailer

- **GIVEN** an e-mail request whose content is written in Japanese and a server whose default locale is English
- **WHEN** the e-mail is sent
- **THEN** the body is exactly the supplied Japanese content

### Requirement: Recipient address list

The system SHALL interpret the request's recipient address as a comma-separated list of one or more addresses, parsed leniently, and SHALL send the e-mail to every listed address as a direct (To) recipient, with no copy or blind-copy recipients.

#### Scenario: Two recipients in one request

- **GIVEN** an e-mail request whose recipient address is "a@example.com, b@example.com"
- **WHEN** the e-mail is sent
- **THEN** both addresses receive the e-mail as To recipients and no Cc or Bcc recipient is set

### Requirement: Send failure handling

GIVEN a well-formed e-mail request, WHEN sending fails for any reason (mail server unreachable or rejecting, mail configuration missing, invalid recipient), the system SHALL discard the request without retrying, SHALL record the error only in the server's diagnostic output, and SHALL treat the request as processed.

#### Scenario: Mail server unreachable

- **GIVEN** a well-formed e-mail request and an unreachable mail server
- **WHEN** the mail-delivery service attempts to send it
- **THEN** a diagnostic error is written to the server error output, the request is removed from the queue, and it is never retried

### Requirement: Malformed request rejection

GIVEN an e-mail request that is not readable text or does not conform to the e-mail request format, the system SHALL fail processing of that request with an error, MUST NOT send any e-mail for it, and SHALL roll back its receipt so the messaging infrastructure governs redelivery.

#### Scenario: Request is not a valid mail document

- **GIVEN** a queued e-mail request whose text is not a valid e-mail request document
- **WHEN** the mail-delivery service receives it
- **THEN** no e-mail is sent, an error is raised, and the request is returned to the queue rather than consumed

### Requirement: Order notification e-mails

WHEN notifications are enabled, the system SHALL e-mail the customer once when their order is approved, once for each part of the order that is fulfilled (invoiced), and one final time when the order is completely fulfilled.

#### Scenario: Order shipped in two parts

- **GIVEN** all three notifications are enabled and a customer places an order that is approved and then fulfilled in two shipments
- **WHEN** the order completes
- **THEN** the customer has received one approval e-mail, one e-mail per shipment (two), and one completion e-mail

### Requirement: Independent notification switches

The system SHALL allow each of the three order notifications (approval, fulfilment confirmation, completion) to be enabled or disabled independently by deployment configuration, and MUST NOT send a notification of a kind that is disabled.

#### Scenario: Only approval notifications enabled

- **GIVEN** the approval notification is enabled and the confirmation and completion notifications are disabled
- **WHEN** an order is approved and then completely fulfilled
- **THEN** the customer receives the approval e-mail only

#### Scenario: A disabled notification's event occurs

- **GIVEN** the completion notification is disabled
- **WHEN** an order is completely fulfilled
- **THEN** no completion e-mail is sent

### Requirement: Missing notification setting fails startup

The system SHALL read each notification switch from deployment configuration by name, and MUST treat a switch that is absent or not a true/false value as a startup failure of the dependent notification function rather than substituting a default.

#### Scenario: Completion switch not configured

- **GIVEN** the completed-order notification switch is absent from deployment configuration
- **WHEN** the completed-order notification function starts
- **THEN** it fails to start and does not assume the switch is on or off

#### Scenario: Switch has a non-boolean value

- **GIVEN** the confirmation notification switch is configured with the value "yes-please"
- **WHEN** the confirmation notification function starts
- **THEN** it fails to start

### Requirement: Configurable mail server and sender

The system SHALL send customer notification e-mails through a configurable outgoing mail server and account, using a configurable sender address whose shipped value is customerservice@javapetstoredemo.com.

#### Scenario: Operator changes the mail server

- **GIVEN** the operator configures mail host smtp.example.com and sender orders@example.com
- **WHEN** a notification e-mail is sent
- **THEN** it is delivered through smtp.example.com with From address orders@example.com
