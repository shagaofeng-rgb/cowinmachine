# Product detail page reconstruction change log

Generated locally: 2026-08-14T05:33:22.977Z

## Scope

- Rebuilt the shared dynamic product detail template at `app/products/[category]/[slug]/page.tsx`.
- Added a route-to-canonical-profile dataset derived from the audit and research dossiers.
- Added product content/evidence types, Product and Breadcrumb JSON-LD, a technical-review card, RFQ product-context prefill, and review-state rendering.
- Updated the site contact configuration to the supplied COWIN MACHINE contact details.
- No website deployment, production data deletion, image download, or source hotlinking was performed.

## Page status

| Status | Pages |
| --- | ---: |
| Full technical content for verified-model records | 68 |
| Request Configuration Review | 134 |
| Duplicate route records | 87 |
| Missing local image | 0 |
| Missing verified specifications | 134 |

## Publication controls

- Full content is limited to canonical families marked `verified-model`. Captured catalog fields are shown with a configuration-review qualifier and internal-only evidence records.
- Records with a generic family, duplicate status, potential misclassification, missing model identity, or missing specification evidence show `Request Configuration Review` and do not render a specification table.
- The download CTA is intentionally replaced with `Request Verified Specifications` because no approved PDF is attached.
- Product images remain local project assets only; no external image source is requested or used.

## Review queue

See `docs/product-detail-page-review-queue.csv` for every route, canonical mapping, evidence status, image status and required next action.

## Required owner inputs before expanding technical claims

1. Approved model-specific manufacturer datasheet for each review-state family.
2. Confirmation of duplicate consolidation and any category correction.
3. Authorized image rights plus updated imagery where the supplied asset changes.
4. Model-specific limits, test conditions, certifications, material compatibility and safety documentation where a claim is needed.
