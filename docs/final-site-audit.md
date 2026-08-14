# COWIN MACHINE Pre-Production Site Audit

**Audit date:** 14 August 2026  
**Release decision:** **BLOCKED — do not deploy to production**  
**Audit method:** local production build, route crawl, code/configuration review, product-data review, generated-document checks, and limited browser automation. This report does not claim legal clearance, search-engine indexing, or product-fact verification beyond the evidence recorded in the repository.

## Executive summary

The application builds successfully and its core information architecture is in place: six product categories, 202 product-detail routes, navigation drawers, inquiry prefill, sitemap, robots, RSS, structured-data components, product research files, and a draft-only content workflow. However, it is **not ready for production**. Three P0 risks can expose unverified technical claims or unsupported image-rights claims, and six P1 issues affect product-page reliability, inquiry handling, security posture, or mobile conversion behavior.

No production deployment, publication, data deletion, or Git push was performed as part of this audit.

## Evidence summary

| Area | Result | Evidence |
| --- | --- | --- |
| Product inventory | 202 current records across six categories | `data/product-audit/raw-product-inventory.json` |
| Canonical master | 135 canonical product families | `data/product-audit/canonical-product-master.json` |
| Duplicate raw records | 87 | Canonical master and product issue CSV |
| Verified-model families | 68 | Canonical master status distribution |
| Generic / owner-confirmation / possible-misclassification families | 67 | Canonical master status distribution |
| Detail-page states | 68 full technical, 134 configuration review | `data/product-detail/product-detail-content.json` |
| Local route crawl | 218 seed pages; 624 unique internal links; all returned HTTP 200 | Local production-server crawl |
| Product routes generated | 202 product routes; build completed | Next.js production build |
| Inquiry API | Valid, invalid, and honeypot paths tested | Local `POST /api/inquiry` tests |
| News workflow | 6 eligible candidates; 3 saved draft items; 0 published | `data/content-automation/content-state.json` |
| Research Word documents | Structural and accessibility scripts returned zero findings | `docs/COWIN-MACHINE-*.docx` audits |

### Current records by category

| Category | Current record count |
| --- | ---: |
| Compressed air equipment | 36 |
| Generator systems | 10 |
| Drilling equipment | 12 |
| Drilling consumables | 16 |
| Mobile lighting systems | 39 |
| Magnetic separators | 89 |
| **Total** | **202** |

## P0 — blocks release

### P0-01 — Configuration-review category cards still expose technical values

**Finding:** 134 product profiles are marked `configuration-review`; their detail pages are intended to avoid technical commitments. Yet category-card data still renders `keySpecifications` for these records. At least 41 review-state products contain values beyond “Model reference” and “Configuration”, so unverified technical values can be shown before a technical review.

**Impact:** Public technical promises can be made for records that the product master explicitly says require confirmation.

**Required resolution:** Render only identity, non-technical category context, and “Request Configuration Review” for every review-state record. Move any technical value behind an evidence gate that requires an owner-approved source or manufacturer documentation. Re-crawl all category pages after the change.

### P0-02 — Product schema exposes specifications without independent evidence

**Finding:** The 68 `verified-model` families have technical values and Product JSON-LD. Their recorded evidence is currently `current-site` only; no owner-approved datasheet, manufacturer document, or equivalent independent source is attached to the master for those values.

**Impact:** Technical specifications are presented both in page content and machine-readable Product schema without a sufficiently traceable source. This is an accuracy and search-representation risk.

**Required resolution:** Attach field-level evidence for every published value, or remove the value and corresponding `additionalProperty` schema output. Keep products in the configuration-review state until the evidence is recorded. Do not create Offer, review, rating, warranty, capacity, performance, or certification claims.

### P0-03 — Image authorization is asserted but not auditable

**Finding:** All 202 detail profiles currently use the label “Authorized project image available.” The image-asset manifest contains no per-asset ownership, licence, source, watermark-review, or approval record. One product (`/products/magnetic-separators/mag-series-080-080`) also has no hero image configured.

**Impact:** The site can make an unsupported authorization claim and may publish an image containing an old brand, watermark, contact detail, or unlicensed material.

**Required resolution:** Create a versioned image-rights manifest for every public image, including local path, source, authorization owner, authorization date, permitted scope, watermark/old-brand review, and reviewer. Hide the authorization label until records exist. Replace or omit any asset that cannot be documented; supply a compliant image for the missing hero route.

## P1 — resolve before production recommendation

### P1-01 — Review-state product overview has a visible `undefined` defect

**Finding:** Review-state pages render text beginning with `undefined is retained as a …`; reproduced locally on `/products/magnetic-separators/mag-rcyd-001`.

**Impact:** Broken public product copy reduces trust and may be indexed.

**Required resolution:** Provide a safe generic status message that never interpolates an absent field, then route-test all 134 review pages.

### P1-02 — Inquiry success message promises a 24-hour reply without configured evidence

**Finding:** The API returns “Our sales team will reply within 24 hours.” There is no configured, verified service-level commitment or downstream CRM/email delivery in this deployment.

**Impact:** The site makes an operational promise that may not be met.

**Required resolution:** Replace with a non-committal receipt message, or add a verified, owner-approved response commitment and real delivery workflow.

### P1-03 — Inquiry endpoint has honeypot validation but no effective rate limit or durable submission store

**Finding:** `/api/inquiry` validates fields and the honeypot correctly, but does not persist submissions and has no deployable request-rate control. The content storage layer also intentionally blocks file writes on Vercel.

**Impact:** Spam and repeated submissions can reach the handler; valid inquiries cannot be reliably handed to a sales workflow in production.

**Required resolution:** Add a server-side rate-limit adapter and a production-safe submission destination selected through environment variables. Test retry/error behavior without exposing secrets. Keep the form in a clear non-delivery state until the destination is configured.

### P1-04 — Production security headers are absent

**Finding:** No Content-Security-Policy, Permissions-Policy, Referrer-Policy, X-Content-Type-Options, frame-ancestor protection, or HTTPS-edge HSTS policy was found in the application/deployment configuration.

**Impact:** The default security posture is weaker than appropriate for a public lead-generation site.

**Required resolution:** Add a tested header policy appropriate to Next.js assets and forms. Configure HSTS only at the HTTPS edge after domain and redirect validation. Verify headers on a Vercel preview and production domain before release.

### P1-05 — Mobile drawer does not present the quote CTA before navigation

**Finding:** On the mobile drawer, the quote CTA appears after the Products accordion and other navigation links. The stated requirement is to show Request a Quote before all mobile menu items.

**Impact:** A primary conversion path is less discoverable and does not meet the specified mobile behavior.

**Required resolution:** Move the CTA to the top of the mobile drawer and manually test at 320 px, tablet width, and desktop breakpoint.

### P1-06 — Visual acceptance cannot yet be evidenced

**Finding:** Static code inspection supports keyboard controls, Escape handling, focus return, scroll lock, reduced motion, table overflow, and responsive drawer rules. Automated visual capture could not complete in this environment because the available Chrome headless process failed during GPU startup; therefore desktop/tablet/mobile visual behavior is not independently evidenced.

**Impact:** Layout, focus visibility, and drawer behavior may still fail on real browsers or touch devices.

**Required resolution:** Perform a recorded manual acceptance pass on Chrome, Safari/iOS, and Android Chrome at 320 px, 768 px, 1024 px, and desktop widths. Include keyboard-only drawer and form testing.

## P2 — improve before or immediately after controlled launch

- **P2-01:** `sitemap.ts` uses the current generation date as `lastModified` for non-article pages. Use a real content-update source so crawlers do not receive artificial changes.
- **P2-02:** Explicitly disallow internal operational paths and non-public API paths in robots policy while retaining public route discovery.
- **P2-03:** The RSS, Article JSON-LD, and FAQPage JSON-LD implementations exist, but there are no published news articles. Validate the first approved article end-to-end before enabling publication.
- **P2-04:** Three persisted pending-review drafts were generated before later quality-gate improvements. Re-run all gates before a reviewer can approve them.
- **P2-05:** The three existing Word research reports passed structural/accessibility scripts, but visual rendering could not be completed locally because a LibreOffice-compatible renderer is unavailable. Render and inspect them on a document-capable environment.
- **P2-06:** Add a link-check and accessibility smoke test to CI, including product review-state content, schema coverage, drawer keyboard flow, and 320 px form layout.

## P3 — growth and operational maturity

- **P3-01:** Add a Search Console adapter only after credentials and ownership are configured; show truthful states such as `discovery-pending` and `crawl-status-unknown`, never a guarantee of indexing.
- **P3-02:** Add a controlled image-review workflow with alternate crop and alt-text review; no AI-generated, supplier, or stock asset should enter the site without the rights manifest.
- **P3-03:** Establish product-owner review SLAs, a supplier-document intake checklist, and a field-level evidence expiry/revalidation process.
- **P3-04:** Use a preview deployment and versioned content snapshot for each release so product, schema, sitemap, and article changes can be compared before promotion.

## Confirmed controls and positive findings

- Public code scan found no prohibited competitor or legacy company names, logos, telephone numbers, addresses, tracking identifiers, or external hotlinks in the reviewed public application scope. The permitted contact email includes the `cowinmagnet.com` domain because it was supplied as the COWIN MACHINE contact; it is not a displayed competing brand.
- The Organization schema uses only the supplied safe identity fields.
- Product routes use self-domain canonical construction; local spot checks confirmed product and RFQ canonicals resolve to the COWIN MACHINE route path.
- Configuration-review pages omit Product JSON-LD, which is the correct direction; the content defect and category-card leak still require correction.
- 202 product routes were generated, and the local full-route crawl found 624 unique internal href targets with HTTP 200 responses.
- The inquiry route handled valid, validation-failure, and honeypot-failure scenarios in local testing. It intentionally does not expose secrets.
- The Products mega drawer and menu drawer are separate client-side components with mutually exclusive open state; mobile products are contained in an accordion rather than a duplicate mega drawer.
- The content automation defaults are `CONTENT_MODE=draft` and `AUTO_PUBLISH=false`; current content state contains three pending-review items and zero published items.
- Lint, TypeScript checking, content-automation validation, and a production build completed successfully in the audited local state.

## News, SEO, and GEO review

The repository contains a source-candidate library and an original-draft workflow rather than a published article corpus. It records candidate quality, originality risk, recent-source eligibility, internal-link requirements, and draft/publish controls. This is a useful operating foundation, not proof that every future article will be original or factually valid. Approval must remain human-gated until the source, product evidence, image rights, and similarity reports are reviewed for each item.

The site has sitemap, robots, RSS, canonical, Open Graph, Product, BreadcrumbList, Article, and conditional FAQ schema implementations. Those mechanisms improve discovery and machine readability, but they cannot guarantee Google, AI-system, or other search-engine inclusion.

## Word research report review

The following research reports exist and passed the project’s structural heading/accessibility scripts with zero reported findings:

- `docs/COWIN-MACHINE-Product-Research-Report.docx`
- `docs/COWIN-MACHINE-Industry-and-Application-Research.docx`
- `docs/COWIN-MACHINE-90-Day-News-and-Content-Plan.docx`

They provide an internal evidence baseline, not legal authorization for images, data sheets, certification claims, or technical values. Their production use remains conditional on the P0 evidence gaps being closed.

## Required release sequence and rollback

1. Resolve and regression-test every P0 and P1 item in this report.
2. Generate a product-data snapshot, evidence manifest, image-rights manifest, and review sign-off before creating a release candidate.
3. Deploy only to a preview environment; run route, form, header, sitemap, RSS, schema, mobile, and security-header checks there.
4. Obtain owner sign-off for product facts, images, response commitment, and public contact data.
5. Tag the approved Git commit and retain the previous production deployment identifier. If a regression appears, promote the prior deployment and restore the prior content-state snapshot; keep `CONTENT_MODE=draft` and `AUTO_PUBLISH=false` during rollback.

## Deployment decision

**Do not deploy.** P0 and P1 issues remain open. A deployment recommendation can be given only after the required evidence, technical-content gating, inquiry reliability, security headers, mobile CTA order, and real-device acceptance checks are completed and recorded.
