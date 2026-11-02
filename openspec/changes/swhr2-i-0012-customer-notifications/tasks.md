## 1. E-mail request contract

- [x] 1.1 Define the e-mail request type with recipient address, subject and content, all required (SWHR2-T-0313; SWHR2-R-0130)
- [x] 1.2 Implement request parsing that rejects a request missing any of the three fields (SWHR2-T-0313; SWHR2-R-0130)
- [x] 1.3 Implement lenient comma-separated recipient-list parsing into To recipients only (SWHR2-T-0313; SWHR2-R-0016)

## 2. Delivery channels

- [x] 2.1 Provide a durable outbound mail-delivery queue (SWHR2-T-0313; SWHR2-R-0062)
- [x] 2.2 Provide a durable order-approval notification channel (SWHR2-T-0313; SWHR2-R-0067)
- [x] 2.3 Provide a durable completed-order notification channel (SWHR2-T-0313; SWHR2-R-0067)
- [x] 2.4 Create all three channels as part of installation/setup (SWHR2-T-0313; SWHR2-R-0067)

## 3. Mail-delivery service

- [x] 3.1 Implement the consumer that sends exactly one e-mail per accepted request (SWHR2-T-0313; SWHR2-R-0062)
- [x] 3.2 Compose messages as HTML with a UTF-8 body, configured sender and send-time date (SWHR2-T-0313; SWHR2-R-0017, SWHR2-R-0131)
- [x] 3.3 Send content unchanged with no templating or locale selection in the mailer (SWHR2-T-0313; SWHR2-R-0131)
- [x] 3.4 On send failure, log a diagnostic, consume the request and do not retry (SWHR2-T-0313; SWHR2-R-0067)
- [x] 3.5 On a malformed request, raise an error, send nothing and return the request to the queue (SWHR2-T-0313; SWHR2-R-0130)

## 4. Mail server configuration

- [x] 4.1 Make the outgoing mail host and account configurable (SWHR2-T-0313; SWHR2-R-0065, SWHR2-R-0017)
- [x] 4.2 Make the sender address configurable with the shipped value customerservice@javapetstoredemo.com (SWHR2-T-0313; SWHR2-R-0017)

## 5. Order notifications

- [x] 5.1 Send the order-approval e-mail when an order is approved (SWHR2-T-0313; SWHR2-R-0064, SWHR2-R-0066)
- [x] 5.2 Send a fulfilment confirmation e-mail for each fulfilled (invoiced) part of an order (SWHR2-T-0313; SWHR2-R-0064, SWHR2-R-0066)
- [x] 5.3 Send the completion e-mail when an order is completely fulfilled (SWHR2-T-0313; SWHR2-R-0132)
- [x] 5.4 Add an independent deployment switch for each of the three notifications (SWHR2-T-0313; SWHR2-R-0015)
- [x] 5.5 Suppress a notification whose switch is disabled (SWHR2-T-0313; SWHR2-R-0015, SWHR2-R-0014)
- [x] 5.6 Fail startup of a notification function whose switch is absent or not a boolean (SWHR2-T-0313; SWHR2-R-0014)
- [x] 5.7 Compose the completion e-mail with subject "Java Pet Store Order COMPLETED: <order id>", every order line and the order's locale (SWHR2-T-0313; SWHR2-R-0132)
- [x] 5.8 Consume the triggering message without sending mail when its notification is switched off (SWHR2-T-0313; SWHR2-R-0063)

## 6. Verification

- [x] 6.1 Test request-format acceptance and rejection (SWHR2-T-0313; SWHR2-R-0130)
- [x] 6.2 Test message composition, recipient parsing and unchanged content (SWHR2-T-0313; SWHR2-R-0016, SWHR2-R-0131)
- [x] 6.3 Test send-failure discard and malformed-request rollback (SWHR2-T-0313; SWHR2-R-0067, SWHR2-R-0130)
- [x] 6.4 Test the notification sequence for an order fulfilled in several parts (SWHR2-T-0313; SWHR2-R-0064, SWHR2-R-0066)
- [x] 6.5 Test switch combinations and missing or invalid switch startup failure (SWHR2-T-0313; SWHR2-R-0014, SWHR2-R-0015, SWHR2-R-0063)
