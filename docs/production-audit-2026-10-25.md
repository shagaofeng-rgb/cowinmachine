# COWIN MACHINE Production Audit — 2026-10-25

This report records what was verified during the front-end, operations, data, and search audit. It does not claim that Google has indexed every URL or that unsubmitted customer inquiries exist.

## Coverage and evidence

| Area | Verification | Result |
| --- | --- | --- |
| Public URL availability | HEAD request to all 559 URLs in the production XML sitemap | 559 HTTP 200; no failures |
| Responsive templates | Browser inspection at 390px mobile and desktop width for home, products, category, product detail, news, blog, quote, contact, and about | No horizontal overflow or broken images in sampled templates; one H1 and English document language per sampled page |
| Navigation | Mobile menu/category selection and desktop Products drawer click/category navigation | Mobile worked; desktop click-close defect fixed and retested locally |
| Product detail | Routed Overview, Applications, Specifications, Configuration, Maintenance, FAQ, and Related Equipment views | Separate views rather than one continuously stacked document |
| SEO and AI discovery | robots.txt, sitemap.xml, llms.txt, canonical metadata and template headings | Accessible and consistently point to cowinmachine.com; admin and API routes excluded from crawl |
| Blog publication | Production database and public Blog | 28 published third-party Blog articles, including a 2026-10-25 article visible on the front end |
| Inquiry persistence | Marked request through production `/api/inquiry`, then database read | HTTP 200; lead, customer association, and activity persisted; all marked test records removed |
| Analytics persistence | Marked request through production `/api/analytics/events`, then database read | HTTP 202; paid channel, Google referrer, landing path, US/CA location, and language persisted; all marked test records removed |
| Backend query | EXPLAIN ANALYZE for top-page report on production Neon | 0.083 ms database execution with current small data volume; this is not total authenticated page load time |
| Runtime errors | Vercel grouped runtime errors, previous seven days | Blog webhook audit inserts rejected by an older image-status CHECK constraint; compatibility fix included |
| Production build | Next.js 16.3.5 build, TypeScript, ESLint, site tests | Passed after repairs |

## Repairs in this release

- Corrected the admin custom date regex, Shanghai-local Monday calculation, impossible calendar date rejection, and date preservation through filters, pagination, view tabs, and journey links.
- Counted only `page_view` events in the top-pages report and based country totals on events within the selected time range, rather than each visitor's latest activity date.
- Prevented same-site referrals from being mislabeled as external referral traffic.
- Kept the desktop Products drawer open after a click even when pointer entry had already opened it.
- Mapped the new managed-cover outcomes to the existing production webhook audit constraint without changing the Blog publishing path. The audit record still distinguishes omission reasons in the publisher response/logs.
- Removed the temporary customer as well as the temporary lead in the database write-health check.
- Removed a homepage claim that every News and Blog item had been source-reviewed, since the external Blog plugin publishes separately.

## Remaining external limits

- Several externally supplied Blog covers are only about 329–390 pixels wide. They load and fit the layout, but cannot become genuinely high-resolution without larger source images from the publishing plugin. Supply at least 1200-pixel-wide licensed cover images for future posts and replace low-resolution originals where available.
- First-party analytics requires visitor consent. At audit time the production database contained 19 events, seven sessions, four visitors, and zero genuine inquiries. These figures must not be compared directly with raw server traffic or Search Console impressions. The marked write tests were removed.
- The admin is Basic Auth protected. Database query execution and unauthenticated protection were verified, but a full authenticated dashboard load-time measurement was not possible without an authorized login session.
- Search Console indexing and AI answer inclusion are controlled by external crawlers. Valid sitemap responses and metadata are prerequisites, not proof of indexing. The configured Google discovery cron remains weekly on Monday at 02:30 UTC.
- The Blog webhook compatibility fix should be checked against the next external publish event; this audit did not generate an unrequested third-party article.
