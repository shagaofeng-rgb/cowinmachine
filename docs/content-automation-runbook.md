# COWIN MACHINE content automation runbook

## Daily News publishing guarantee

- `/api/cron/news-discover` stores source health and eligible external candidates before the publishing window.
- `/api/cron/news-publish` publishes a verified external update when one passes every source and editorial gate.
- When no external candidate is eligible, the publisher selects a verified COWIN MACHINE product and an unused editorial angle. Product URLs are cooled down for 60 days and exact product-angle topics are blocked for 180 days.
- Shared compliance wording in technical briefs is measured and saved in the quality report, but it does not block an otherwise unique product topic. Near-exact titles, repeated topics, language failures and fact-lock failures still block publication.
- Every publish result is written to `news_runs` and emitted as a structured `news.publish.result` log. A blocked cron responds with HTTP 503 so monitoring cannot mistake it for a successful publication.
- The News index, detail routes, sitemap and RSS feed read published articles directly from the persistent content store and require no redeploy after a scheduled publication.

## Current deployment and persistence finding

Production uses the Neon content-store adapter selected by `DATABASE_URL` or `POSTGRES_URL`. The file adapter remains limited to local development and refuses Vercel writes so a deployment cannot silently lose generated content.

## Default operating mode

- Discovery schedule: `10 0 * * *` UTC.
- Publishing schedule: `45 1 * * *` UTC.
- Mode defaults to `publish` unless `CONTENT_MODE=draft` is set.
- Auto publish defaults to enabled unless `AUTO_PUBLISH=false` is set.
- Published state: only an article whose stored status is `published` appears on `/news`, `/news/[slug]`, `/sitemap.xml`, or `/feed.xml`.

## Scheduler invocation

Run the generic scheduler client from an approved scheduler host:

```text
pnpm content:schedule -- --dry-run
pnpm content:schedule
```

It requires `CONTENT_AUTOMATION_URL` and `CONTENT_AUTOMATION_TOKEN` (or `CRON_SECRET`). The protected route is `/api/content-automation/run`. No secret is logged or sent to the browser.

## Selection and quality flow

1. Read the source candidate register, product audit and content queue.
2. Select a `research-ready` topic with two mapped eligible sources.
3. Reject any product + industry + scenario combination used in the past 60 days.
4. Load the local original draft; do not fetch or copy a source page.
5. Validate verified product mapping, two recent sources, visible source links, image status, three internal links, title similarity, body n-gram similarity and required FAQ/source sections.
6. In draft mode, save `pending-review` or `blocked` state. In enabled publish mode, save `published` only if every check passes.
7. Dynamic sitemap and RSS read only `published` records. Discovery state begins as `included-in-sitemap`; it is not a Google indexing guarantee.

## Image policy

The image manifest begins empty. A future article image must include its local path, alt text, provenance and `authorized` status. News-source images, competitor imagery, PDFs, logos, screenshots, tracking URLs and hotlinks are prohibited. An article may remain text-only until an authorized asset is available.

## Protected management page

`/internal/content-operations` is deliberately a 404 unless `CONTENT_ADMIN_ENABLED=true` and both basic-auth environment values exist. When enabled, `proxy.ts` requires authentication for the management page and manual content-operation endpoint. The page shows the article queue, source/quality failures, schedule, publishing history, sitemap state and Search Console adapter status.

## Search Console monitoring

The current adapter reports only truthful configuration state: `not-configured` or `configuration-required`. It does not call Google, claim indexing, or use the Indexing API. Implement an approved server-side API client only after credentials and property ownership are supplied; retain status values `crawl-status-unknown`, `indexed-confirmed` and `not-indexed` only when a real read returns them.

## Enabling automatic publication

1. Confirm Neon database and `CRON_SECRET` are configured for Production.
2. Keep `CONTENT_MODE=publish` and `AUTO_PUBLISH=true`, or rely on their production defaults.
3. Confirm the two News cron routes are present in the production deployment.
4. Verify the first result in `news_runs` and the structured Vercel runtime log.
5. Verify the News index, article detail, sitemap, RSS, metadata, JSON-LD, canonical URLs and source links.

## Rollback

Set `AUTO_PUBLISH=false` and `CONTENT_MODE=draft`, disable the scheduler, then change the stored article status from `published` to `pending-review` in the durable store. Sitemap and RSS will remove that record on their next read. Do not delete source audit history.
