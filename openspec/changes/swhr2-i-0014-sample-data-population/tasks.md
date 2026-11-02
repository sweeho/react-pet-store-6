## 1. Seed data

- [ ] 1.1 Port the storefront seed data set: 4 users, 4 customers, 5 categories, 16 products, 28 items with en/ja/zh details and prices (SWHR2-T-0321; SWHR2-R-0072)
- [ ] 1.2 Port the supplier seed inventory: EST-1 to EST-29 at quantity 10000 (SWHR2-T-0321; SWHR2-R-0071)
- [ ] 1.3 Resolve finding F1 (EST-29 stocked but not catalogued) with the Business Owner and adjust the seed accordingly (SWHR2-T-0321; SWHR2-R-0071)
- [ ] 1.4 Default a seed inventory entry with no quantity to 0 on load (SWHR2-T-0321; SWHR2-R-0071)
- [ ] 1.5 Keep the seed data set in one editable UTF-8 source that operators can change (SWHR2-T-0321; SWHR2-R-0069)

## 2. Datastore provisioning

- [ ] 2.1 Provide separate storage for storefront, supplier and order-processing data, created empty when absent and kept when present (SWHR2-T-0321; SWHR2-R-0074)
- [ ] 2.2 Create the datastore structures the seed load needs when they are absent (SWHR2-T-0321; SWHR2-R-0069)
- [ ] 2.3 Generate each application area's datastore structures before that area is served (SWHR2-T-0321; SWHR2-R-0075)
- [ ] 2.4 Make the storefront, order-processing, supplier and administration areas available after installation (SWHR2-T-0321; SWHR2-R-0075)
- [ ] 2.5 Serve the storefront at the "/petstore" path (SWHR2-T-0321; SWHR2-R-0075)

## 3. Seeding operations

- [ ] 3.1 Provide the list-all-customers query (SWHR2-T-0321; SWHR2-R-0068)
- [ ] 3.2 Create sample contact information linked to the stored address rather than a copy (SWHR2-T-0321; SWHR2-R-0070)
- [ ] 3.3 Replace sample users and customers by id while leaving other accounts untouched (SWHR2-T-0321; SWHR2-R-0073)

## 4. Verification

- [ ] 4.1 Test the seeded storefront counts and the three languages per item (SWHR2-T-0321; SWHR2-R-0072)
- [ ] 4.2 Test the seeded supplier stock and the missing-quantity default (SWHR2-T-0321; SWHR2-R-0071)
- [ ] 4.3 Test that an edited seed data set is reflected after loading (SWHR2-T-0321; SWHR2-R-0069)
- [ ] 4.4 Test sample-account replacement preserves non-sample accounts (SWHR2-T-0321; SWHR2-R-0073)
- [ ] 4.5 Test contact information keeps the supplied values and refers to the stored address (SWHR2-T-0321; SWHR2-R-0070)
- [ ] 4.6 Test list-all-customers with and without customers (SWHR2-T-0321; SWHR2-R-0068)
- [ ] 4.7 Test fresh installation creates the three datastores and serves the storefront at "/petstore" (SWHR2-T-0321; SWHR2-R-0074, SWHR2-R-0075)
