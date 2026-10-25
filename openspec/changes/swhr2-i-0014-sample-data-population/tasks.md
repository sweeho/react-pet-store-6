## 1. Seed data

- [ ] 1.1 Port the storefront seed data set: 4 users, 4 customers, 5 categories, 16 products, 28 items with en/ja/zh details and prices
- [ ] 1.2 Port the supplier seed inventory: EST-1 to EST-29 at quantity 10000
- [ ] 1.3 Resolve finding F1 (EST-29 stocked but not catalogued) with the Business Owner and adjust the seed accordingly
- [ ] 1.4 Default a seed inventory entry with no quantity to 0 on load
- [ ] 1.5 Keep the seed data set in one editable UTF-8 source that operators can change

## 2. Datastore provisioning

- [ ] 2.1 Provide separate storage for storefront, supplier and order-processing data, created empty when absent and kept when present
- [ ] 2.2 Create the datastore structures the seed load needs when they are absent
- [ ] 2.3 Generate each application area's datastore structures before that area is served
- [ ] 2.4 Make the storefront, order-processing, supplier and administration areas available after installation
- [ ] 2.5 Serve the storefront at the "/petstore" path

## 3. Seeding operations

- [ ] 3.1 Provide the list-all-customers query
- [ ] 3.2 Create sample contact information linked to the stored address rather than a copy
- [ ] 3.3 Replace sample users and customers by id while leaving other accounts untouched

## 4. Verification

- [ ] 4.1 Test the seeded storefront counts and the three languages per item
- [ ] 4.2 Test the seeded supplier stock and the missing-quantity default
- [ ] 4.3 Test that an edited seed data set is reflected after loading
- [ ] 4.4 Test sample-account replacement preserves non-sample accounts
- [ ] 4.5 Test contact information keeps the supplied values and refers to the stored address
- [ ] 4.6 Test list-all-customers with and without customers
- [ ] 4.7 Test fresh installation creates the three datastores and serves the storefront at "/petstore"
