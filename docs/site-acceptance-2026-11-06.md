# Cowin Machine site acceptance | 2026-11-06

Scope: `cowinmachine.com` only. Baseline: GitHub `53872b3`, Vercel `dpl_2z1iN2wPP3re3bNyqxDNoMM2t8Gk`. The release was prepared in a clean checkout of that commit; the existing local workspace was not staged.

## Changes and verification

| Area | Verified finding and change | Release check |
| --- | --- | --- |
| Inquiry | The old lead insert and customer linkage were separate. Unhydrated forms also defaulted to GET. The server now resolves equipment context from the catalog, stores the lead, customer link and creation event atomically, and deduplicates retries by submission ID. | On an isolated PostgreSQL fixture: form validation, lost response and repeat, invalid origin, honeypot, injected activity insert failure with rollback, correct model/category/source, and consent-independent inquiry. |
| Tracking | Page/session/visitor writes and attribution are separated from the lead workflow. The server checks analytics consent and visitor identity; session channel, landing path and product URL are distinct. | Consent refusal and withdrawal, country/region, campaign attribution, and separate analytics and inquiry counts. No test traffic is required to enable production tracking. |
| Public UX | Desktop menu hover and keyboard focus use the same disclosure; mobile drawer restores focus. Product panels still switch in place. Homepage offers separate News and Blog links. Catalog values are retained; equivalent units are shown only when the conversion is unambiguous. | Desktop/mobile page templates, keyboard and pointer paths, reduced motion, layout, image visibility, contact links, catalog and article pagination. |
| Images | 135 canonical catalog records reference 134 existing catalog photos; one record (`mag-series-080-080`) has no approved photo. Small JPEG/WebP detail images use the original, and the logo advertises its displayed size. | No invented photo or specification. Replacement of low-resolution originals depends on verified assets. |
| Admin | Real SQL-backed product, market, content and health reports replace placeholder metrics. The private console uses one main landmark, a compact mobile navigation, date presets, lead filters, detail and follow-up history. | Authorized preview with synthetic rows, including visitor/customer journeys and status writes. Production credentials were not retrieved or replaced. |
| SEO and AI | Public pages expose rendered English content, canonical URLs, index directives, structured data and public crawl links. Historical Blog links under News permanently redirect; legacy product sections keep their anchors. | Recheck sitemap URLs, 135 product routes, redirects, exclusion rules, robots, AI crawler-compatible content, and distinct RSS feeds. No generic indexing API or forced canonical merges. |
| Content sync | List, RSS and sitemap reads select summary fields instead of pulling all article bodies; detail reads the requested published slug. The production database had about 202 KB of article body text per previous all-row read. | News automation remains disabled. The third-party Blog endpoint, credentials, and upload flow were not changed. On Nov 6 a Blog article and its stored image were confirmed in production data. |
| Performance | Before release, three-run slow-mobile medians were LCP 3.60s home, 2.84s catalog, 5.05s sample product and 6.57s Blog; lab CLS was zero. A production 90-day aggregate SQL sample executed in about 1.3 ms, excluding network/render time. | Repeat lab runs after deployment; do not infer real-user INP or global coverage from the lab. PageSpeed API returned quota HTTP 429. |
| Security and recovery | Admin routes are authenticated, marked private/no-store and noindex; public CSP and HSTS remain enforced. The database restore window observed in Neon was 6 hours. | Monitor inquiry and Blog function errors in Vercel. Keep the previous deployment available; no schema migration or production database restore is required for this release. |

## Google evidence

- The existing Monday 10:30 China-time schedule remains in `vercel.json`. The last recorded submission was November 2, HTTP 204 with HTTP 200 read-back. A fresh read-only API check found a November 4 download, no processing pending, and 0 warnings/errors.
- Home page inspection: submitted and indexed, last crawl November 4, Google canonical and user canonical both `https://cowinmachine.com/`.
- Current-sitemap sample at read-back: 163 URLs, 81 indexed, 63 discovered but not indexed, 18 unknown, 1 inspection unavailable. 43 of the 63 discovered URLs are product details, 16 pagination URLs, 3 News articles and 1 solution page.
- The previous 564-page report was from an earlier sitemap containing duplicate product section routes. Those routes were consolidated before this release. Historical duplicate/404/redirect samples were rechecked, not forcibly redirected to unrelated content.
- URL Inspection describes the indexed or last-known state. It does not submit a URL or establish the result of a live crawl. Do not run an extra scheduled job outside the agreed weekly cadence to refresh an unchanged sitemap URL.

## Release and rollback

Run the production build (including lint, types and repository guards), all site/content tests, the local indexable-sitemap check, and the browser matrix before pushing. After deployment, recheck both domains and the live sitemap, verify the third-party article and image, and submit one uniquely marked test inquiry from a live product page. Confirm its exact model, category, product URL, customer and activity in the production database; remove only that marked inquiry and test customer and verify zero remaining records.

If a production blocker is found, restore the previous Vercel production deployment, then reconcile Git with a reviewed revert; do not reset or delete production data. The new inquiry and admin flows use the existing schema.
