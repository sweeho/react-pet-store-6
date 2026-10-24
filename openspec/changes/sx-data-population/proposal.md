# Proposal: data-population (SX-0001)

## Why

The legacy Java Pet Store 1.3.2 ships with a sample-data loader that every other capability depends on: the catalog, the demo sign-on accounts and customers, and the supplier's stock all come from it. The behaviour is spread over two servlets, five populator classes, two seed files, a start page and the install script, and none of it is written down. This change records that behaviour as draft requirements so the rebuild can match it or deliberately depart from it.

## What changes

- Adds the `data-population` capability as a delta spec (`specs/data-population/spec.md`) with 18 draft requirements covering:
  - when the storefront is judged already populated, and what a full sample load does (rebuild the catalog, replace sample accounts by id, keep other accounts)
  - forced repopulation, session termination, the chained supplier load and the redirect and failure contract
  - the seed data content: 4 users and customers, 5 categories, 16 products, 28 items in 3 languages, and 29 supplier stock lines at 10000
  - datastore separation and the installation sequence
  - two entity-level operations the loader relies on: listing all customers, and creating contact information linked to a stored address
- `design.md` records how the legacy system implements each requirement, the suspected defects and the open questions.

## Out of scope

- The behaviour of the catalog, customer, sign-on and supplier capabilities beyond what seeding them requires.
- Any target design. The Architect drafts that after the Product Requirement is approved.

## Status of the requirements

No record in this capability is SME-approved, so the spec carries no `ID:` lines. Recommendations for each record are in `legacy-analysis/ir/_recommendations/data-population.yaml`. Two requirements need a Business Owner decision before they are built, because they describe legacy behaviour that the extraction flagged as a defect:

- **Population access without sign-on.** Anonymous callers can trigger a destructive reset.
- **Populated-state check.** If the check fails with an error, the catalog is wiped.
