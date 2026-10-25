## 1. E-mail request contract

- [ ] 1.1 Define the e-mail request type with recipient address, subject and content, all required
- [ ] 1.2 Implement request parsing that rejects a request missing any of the three fields
- [ ] 1.3 Implement lenient comma-separated recipient-list parsing into To recipients only

## 2. Delivery channels

- [ ] 2.1 Provide a durable outbound mail-delivery queue
- [ ] 2.2 Provide a durable order-approval notification channel
- [ ] 2.3 Provide a durable completed-order notification channel
- [ ] 2.4 Create all three channels as part of installation/setup

## 3. Mail-delivery service

- [ ] 3.1 Implement the consumer that sends exactly one e-mail per accepted request
- [ ] 3.2 Compose messages as HTML with a UTF-8 body, configured sender and send-time date
- [ ] 3.3 Send content unchanged with no templating or locale selection in the mailer
- [ ] 3.4 On send failure, log a diagnostic, consume the request and do not retry
- [ ] 3.5 On a malformed request, raise an error, send nothing and return the request to the queue

## 4. Mail server configuration

- [ ] 4.1 Make the outgoing mail host and account configurable
- [ ] 4.2 Make the sender address configurable with the shipped value customerservice@javapetstoredemo.com

## 5. Order notifications

- [ ] 5.1 Send the order-approval e-mail when an order is approved
- [ ] 5.2 Send a fulfilment confirmation e-mail for each fulfilled (invoiced) part of an order
- [ ] 5.3 Send the completion e-mail when an order is completely fulfilled
- [ ] 5.4 Add an independent deployment switch for each of the three notifications
- [ ] 5.5 Suppress a notification whose switch is disabled
- [ ] 5.6 Fail startup of a notification function whose switch is absent or not a boolean
- [ ] 5.7 Compose the completion e-mail with subject "Java Pet Store Order COMPLETED: <order id>", every order line and the order's locale
- [ ] 5.8 Consume the triggering message without sending mail when its notification is switched off

## 6. Verification

- [ ] 6.1 Test request-format acceptance and rejection
- [ ] 6.2 Test message composition, recipient parsing and unchanged content
- [ ] 6.3 Test send-failure discard and malformed-request rollback
- [ ] 6.4 Test the notification sequence for an order fulfilled in several parts
- [ ] 6.5 Test switch combinations and missing or invalid switch startup failure
