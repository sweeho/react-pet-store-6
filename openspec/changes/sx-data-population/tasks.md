## 1. Seed data

- [ ] 1.1 Port the storefront seed data set: 4 users, 4 customers, 5 categories, 16 products, 28 items with en/ja/zh details and prices
- [ ] 1.2 Port the supplier seed inventory: EST-1 to EST-29 at quantity 10000
- [ ] 1.3 Resolve finding F1 (EST-29 stocked but not catalogued) with the Business Owner and adjust the seed accordingly
- [ ] 1.4 Validate seed entries on load, defaulting a missing or non-numeric inventory quantity to 0

## 2. Datastore provisioning

- [ ] 2.1 Provide separate storage for storefront, supplier and order-processing data, created automatically when absent
- [ ] 2.2 Create each area's datastore structures before that area is served
- [ ] 2.3 Serve the storefront at the "/petstore" path

## 3. Storefront population

- [ ] 3.1 Implement the populated-state check (categories, products, items, customers, users all non-empty)
- [ ] 3.2 Treat a failed populated-state check as not populated, pending the Business Owner decision on defect D2
- [ ] 3.3 Implement the catalog rebuild that discards and recreates categories, products and items, tolerating absent data
- [ ] 3.4 Load the catalog from the seed data set
- [ ] 3.5 Replace sample users and customers by id while leaving other accounts untouched
- [ ] 3.6 Create sample contact information linked to the stored address rather than a copy
- [ ] 3.7 Provide the list-all-customers query used by the populated-state check
- [ ] 3.8 Implement the forced repopulation path that bypasses the populated-state check

## 4. Supplier population

- [ ] 4.1 Implement the supplier inventory gate (load only when inventory is empty, unless forced)
- [ ] 4.2 Replace any existing inventory record with the same item id on load

## 5. Population flow

- [ ] 5.1 End the requesting visitor's session when population is triggered
- [ ] 5.2 Show the please-wait notice and start population immediately with the chosen mode
- [ ] 5.3 Chain supplier population after storefront population with the same forced choice
- [ ] 5.4 Return the visitor to the storefront main page after the chain completes
- [ ] 5.5 Implement the success redirect (requested destination, else referring page)
- [ ] 5.6 Implement the failure path (requested error destination, else a server error) with a single redirect
- [ ] 5.7 Restrict success and error destinations to the application's own origin (defect D4)
- [ ] 5.8 Encode the mode value wherever it is echoed back to the caller (defect D3)

## 6. Access control

- [ ] 6.1 Apply the Business Owner decision on who may trigger forced repopulation (defect D1, question Q1)

## 7. Verification

- [ ] 7.1 Test population of an empty store and a no-op entry into a populated store
- [ ] 7.2 Test forced repopulation restores seeded catalog values and sample accounts and preserves other accounts
- [ ] 7.3 Test supplier gate, forced reset and quantity defaulting
- [ ] 7.4 Test the redirect and failure contract, including an off-origin destination being refused
- [ ] 7.5 Test the seeded counts match the seed data content requirement
