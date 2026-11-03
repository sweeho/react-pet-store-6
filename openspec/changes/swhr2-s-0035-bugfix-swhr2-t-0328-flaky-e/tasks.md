## 1. Spec fix

- [ ] 1.1 Change the final assertion of e2e/order-approval.spec.ts to accept APPROVED or COMPLETED for the order's non-pending row, reject PENDING and DENIED, and assert the order is gone from the pending view (SWHR2-T-0328; SWHR2-R-0087)
- [ ] 1.2 Rename the spec title to describe the stable outcome, keeping the [SWHR2-C-0243] tag (SWHR2-T-0328; SWHR2-R-0087)

## 2. Verification

- [ ] 2.1 Show the spec passing alone and in several consecutive full e2e runs, with no application file changed (SWHR2-T-0328; SWHR2-R-0087)
