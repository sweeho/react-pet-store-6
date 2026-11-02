# Summary — SWHR2-T-0313 Customer notifications

Approval, shipment and completion e-mails, each behind `NOTIFY_*_ENABLED` (off by default). Order steps only enqueue; handlers check their switch (off = trigger consumed, no mail) and enqueue a `mail.outbound` triple; the worker awaits an nodemailer SMTP send outside the transaction and retries on transport errors. A malformed request is marked `failed`.

Files: `services/notifications/{request,send,config,handlers}.ts`, `templates/{en_US,ja_JP,zh_CN,types}.ts`, tests beside them; `services/messaging/{index,worker}.ts`, `services/orders/{decide,invoice}.ts`, `package.json`/`bun.lock` (nodemailer, @types/nodemailer).

Deviations: existing tests `worker.test.ts` (fan-out subscriber list) and `invoice.test.ts` (select the order-processing subscriber row) updated for the new `notify.shipment` subscriber. Shipment subject is `Java Pet Store Order Shipment: <id>`. Mail subjects are English in all locales; bodies are localized.

AC coverage: AC-1…AC-22 via SWHR2-C-0046…0067 plus deferred C-0136.

Verification: `bun run verify` — pass (398 tests). Locked acceptance suite run by the platform at green.

CODE-REVIEW: self-review — sub-agent skipped to limit cost; checked transaction boundaries (send outside tx), switch read per call, no cc/bcc, HTML-escaped template values.
