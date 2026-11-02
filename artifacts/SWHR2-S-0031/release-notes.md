---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0031
capability_brief: SWHR2-I-0012
branch: vortex/sprint/swhr2-s-0031-cfa6ffdc
upstream: [artifacts/SWHR2-S-0031/qa-test-report.md]
---

# Release notes — SWHR2-S-0031

## Added

- **Order e-mails to customers.** A customer can now be e-mailed when their order is approved ("Order Status: <id>"), each time part of it ships, and once when the whole order has shipped ("Java Pet Store Order COMPLETED: <id>", listing every line with category, product, quantity and unit price). Bodies are written in the language the order was placed in. (SWHR2-T-0313)
- **Each e-mail switches on separately.** Operators enable the approval, shipment and completion e-mails one by one. An e-mail that is switched off is never sent, not even later if it is switched on afterwards. (SWHR2-T-0313)
- **Operator-set mail server.** E-mail goes out through the operator's SMTP server, account and From address. (SWHR2-T-0313)

## Changed

- **E-mail never holds up an order.** Approving and shipping orders only queue the e-mail. If the mail server is slow or down, orders still move on and the e-mail is retried until it is sent. (SWHR2-T-0313)
- **Invoices now have a second reader.** Each shipment invoice is also read by the shipment notifier. How order processing applies invoices is unchanged. (SWHR2-T-0313)

## Upgrade notes

- **Every notification is off by default.** To enable one, set `NOTIFY_APPROVAL_ENABLED`, `NOTIFY_SHIPMENT_ENABLED` and/or `NOTIFY_COMPLETED_ENABLED` to `true`. Any value other than `true` or `false` stops that notification with an error until it is corrected.
- **Mail server settings.** Configure `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD` and `MAIL_FROM`. `MAIL_FROM` defaults to `customerservice@javapetstoredemo.com`.
- **New dependency.** `nodemailer` is a new runtime dependency, so run `bun install` before starting the new build.
- No database migration.
