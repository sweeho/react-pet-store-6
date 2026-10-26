# Proposal: data-population (SX-0001)

## Why

The legacy Java Pet Store 1.3.2 ships with a sample-data loader that every other capability depends on: the catalog, the demo sign-on accounts and customers, and the supplier's stock all come from it. The behaviour is spread over two servlets, five populator classes, two seed files, a start page and the install script, and none of it is written down. This change records that behaviour as draft requirements so the rebuild can match it or deliberately depart from it.

## What changes

- Adds the `data-population` capability as a delta spec (`specs/data-population/spec.md`) carrying the 8 SME-approved requirements of this capability:
  - the seed data content: 4 users and customers, 5 categories, 16 products and 28 items in 3 languages, and 29 supplier stock lines at 10000
  - the editable seed data set and creation of missing datastore structures
  - replacement of sample accounts by id while other accounts are kept
  - datastore separation and the installation sequence
  - two entity-level operations the loader relies on: listing all customers, and creating contact information linked to a stored address
- `design.md` records how the legacy system implements the capability, the suspected defects and the open questions.

## Out of scope

- The behaviour of the catalog, customer, sign-on and supplier capabilities beyond what seeding them requires.
- Any target design. The Architect drafts that after the Product Requirement is approved.

## Status of the requirements

8 records of this capability are approved and each carries its minted `ID:` line in the spec. Every other `data-population` record is pending and is Not specified: it is left out of the spec, and `legacy-analysis/ir/_recommendations/data-population.yaml` gives a recommendation for each. Those pending records cover the core loader flow (when the store is judged populated, the catalog rebuild, forced repopulation, session termination, the chained supplier load, the supplier inventory gate, the redirect and failure contract, and access without sign-on). `design.md` describes how the legacy system implements them; none of it is a requirement until an SME approves the record.
