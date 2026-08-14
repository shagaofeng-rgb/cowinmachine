# COWIN MACHINE Production Release Checklist

**Current status: BLOCKED.** This checklist is designed for a controlled preview-to-production release. Do not mark an item complete without retained evidence.

## P0 release gates — all required

- [ ] Every configuration-review product hides unverified specifications on category cards and detail pages.
- [ ] Every published technical specification has field-level owner-approved or manufacturer-source evidence.
- [ ] Product JSON-LD emits only evidence-backed identity and specifications; unsupported values are removed.
- [ ] Every public image has an image-rights manifest record: local path, source, approval owner/date, allowed use, old-brand/watermark check, and reviewer.
- [ ] The public “authorized image” label is hidden unless a matching manifest record exists.
- [ ] The missing hero image for `mag-series-080-080` is supplied with an approval record, or the page intentionally shows a safe no-image state.
- [ ] Product owner has signed off on all data moved from review state to public technical state.

## P1 release gates — all required

- [ ] The `undefined` review-state overview defect is fixed and all 134 review pages are route-tested.
- [ ] The inquiry receipt wording is owner-approved and does not promise an unconfigured response time.
- [ ] Inquiry delivery, failure handling, rate limiting, and production storage/CRM destination are configured and tested without secrets in the repository.
- [ ] A production-safe security-header policy is deployed and validated on the preview URL.
- [ ] The mobile drawer displays Request a Quote before all menu items.
- [ ] Manual visual and keyboard acceptance is recorded for 320 px, 768 px, 1024 px, and desktop widths on Chrome, Safari/iOS, and Android Chrome.

## Product and content validation

- [ ] Inventory total and category totals are reconciled to the canonical product master.
- [ ] Duplicates, generic series, missing specifications, missing evidence, and possible category mismatches stay in the review queue.
- [ ] No product page claims certification, warranty, delivery time, price, capacity, performance, client relationship, or export coverage without supporting evidence.
- [ ] Related products, solutions, resources, breadcrumbs, and RFQ prefill are tested from representative pages in every category.
- [ ] No competitor/legacy brand, company, email, phone, address, logo, tracking identifier, source URL, image watermark, PDF, or schema residue appears in public output.
- [ ] Product and scene images are local/approved assets only; no supplier or news-site hotlinks are published.
- [ ] News items remain unpublished unless their source, originality, evidence, image rights, and human review records are complete.

## SEO, GEO, and discovery checks

- [ ] Each public route has one canonical pointing to the COWIN MACHINE URL.
- [ ] One H1 only; metadata and Open Graph are complete and route-specific.
- [ ] Product, Organization, BreadcrumbList, Article, and FAQPage JSON-LD are emitted only when their underlying fields are valid and visible.
- [ ] Sitemap URLs, `lastmod` values, robots directives, RSS XML, internal links, 404 behavior, and pagination are checked on preview.
- [ ] Search Console status, if unconfigured, is displayed as configuration-required or unknown — never as indexed or guaranteed.

## Engineering, security, and accessibility checks

- [ ] `lint`, typecheck, production build, content-automation validation, link check, form tests, and schema validation all pass on the release commit.
- [ ] Drawer/menu products, focus return, Escape, overlay close, scroll lock, reduced-motion behavior, and mobile accordion are keyboard tested.
- [ ] Form labels, validation messages, success/error states, focus states, gallery controls, filters, and tables work at 320 px without obstructing the submit action.
- [ ] CSP, frame protection, referrer policy, MIME sniffing protection, permissions policy, and HTTPS-edge HSTS are validated with the deployment platform.
- [ ] Environment variables contain secrets only in deployment settings; repository and build logs contain no secrets.

## Preview, approval, and rollback

- [ ] Produce a release change summary covering product data, images, schema, routes, content-state changes, and environment/configuration changes.
- [ ] Create a preview deployment; do not publish news or enable auto-publish during review.
- [ ] Capture preview screenshots and route/form/security test evidence.
- [ ] Obtain written owner approval for brand/contact data, product facts, image rights, and response wording.
- [ ] Tag the approved commit; retain the prior production deployment ID and a copy of content-state/evidence manifests.
- [ ] Keep `CONTENT_MODE=draft` and `AUTO_PUBLISH=false` until a separate, explicit approval is recorded.
- [ ] Rollback plan tested: promote the previous deployment, restore prior approved content state, disable publish mode, and re-check canonical/sitemap/robots output.

## Release decision record

- Release candidate commit: ____________________
- Preview URL: ____________________
- Evidence bundle location: ____________________
- Product-data owner approval: ____________________
- Image-rights owner approval: ____________________
- Technical review approval: ____________________
- Security review approval: ____________________
- Release decision / date: ____________________
