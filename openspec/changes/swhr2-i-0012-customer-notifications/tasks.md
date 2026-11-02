## 1. E-mail request contract

- [ ] 1.1 Define the e-mail request type with recipient address, subject and content, all required (SWHR2-T-0313; SWHR2-R-0130)
- [ ] 1.2 Implement request parsing that rejects a request missing any of the three fields (SWHR2-T-0313; SWHR2-R-0130)
- [ ] 1.3 Implement lenient comma-separated recipient-list parsing into To recipients only (SWHR2-T-0313; SWHR2-R-0016)

## 2. Delivery channels

- [ ] 2.1 Provide a durable outbound mail-delivery queue (SWHR2-T-0313; SWHR2-R-0062)
- [ ] 2.2 Provide a durable order-approval notification channel (SWHR2-T-0313; SWHR2-R-0067)
- [ ] 2.3 Provide a durable completed-order notification channel (SWHR2-T-0313; SWHR2-R-0067)
- [ ] 2.4 Create all three channels as part of installation/setup (SWHR2-T-0313; SWHR2-R-0067)

## 3. Mail-delivery service

- [ ] 3.1 Implement the consumer that sends exactly one e-mail per accepted request (SWHR2-T-0313; SWHR2-R-0062)
- [ ] 3.2 Compose messages as HTML with a UTF-8 body, configured sender and send-time date (SWHR2-T-0313; SWHR2-R-0017, SWHR2-R-0131)
- [ ] 3.3 Send content unchanged with no templating or locale selection in the mailer (SWHR2-T-0313; SWHR2-R-0131)
- [ ] 3.4 On send failure, log a diagnostic, consume the request and do not retry (SWHR2-T-0313; SWHR2-R-0067)
- [ ] 3.5 On a malformed request, raise an error, send nothing and return the request to the queue (SWHR2-T-0313; SWHR2-R-0130)

## 4. Mail server configuration

- [ ] 4.1 Make the outgoing mail host and account configurable (SWHR2-T-0313; SWHR2-R-0065, SWHR2-R-0017)
- [ ] 4.2 Make the sender address configurable with the shipped value customerservice@javapetstoredemo.com (SWHR2-T-0313; SWHR2-R-0017)

## 5. Order notifications

- [ ] 5.1 Send the order-approval e-mail when an order is approved (SWHR2-T-0313; SWHR2-R-0064, SWHR2-R-0066)
- [ ] 5.2 Send a fulfilment confirmation e-mail for each fulfilled (invoiced) part of an order (SWHR2-T-0313; SWHR2-R-0064, SWHR2-R-0066)
- [ ] 5.3 Send the completion e-mail when an order is completely fulfilled (SWHR2-T-0313; SWHR2-R-0132)
- [ ] 5.4 Add an independent deployment switch for each of the three notifications (SWHR2-T-0313; SWHR2-R-0015)
- [ ] 5.5 Suppress a notification whose switch is disabled (SWHR2-T-0313; SWHR2-R-0015, SWHR2-R-0014)
- [ ] 5.6 Fail startup of a notification function whose switch is absent or not a boolean (SWHR2-T-0313; SWHR2-R-0014)
- [ ] 5.7 Compose the completion e-mail with subject "Java Pet Store Order COMPLETED: <order id>", every order line and the order's locale (SWHR2-T-0313; SWHR2-R-0132)
- [ ] 5.8 Consume the triggering message without sending mail when its notification is switched off (SWHR2-T-0313; SWHR2-R-0063)

## 6. Verification

- [ ] 6.1 Test request-format acceptance and rejection (SWHR2-T-0313; SWHR2-R-0130)
- [ ] 6.2 Test message composition, recipient parsing and unchanged content (SWHR2-T-0313; SWHR2-R-0016, SWHR2-R-0131)
- [ ] 6.3 Test send-failure discard and malformed-request rollback (SWHR2-T-0313; SWHR2-R-0067, SWHR2-R-0130)
- [ ] 6.4 Test the notification sequence for an order fulfilled in several parts (SWHR2-T-0313; SWHR2-R-0064, SWHR2-R-0066)
- [ ] 6.5 Test switch combinations and missing or invalid switch startup failure (SWHR2-T-0313; SWHR2-R-0014, SWHR2-R-0015, SWHR2-R-0063)
