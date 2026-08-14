# COWIN MACHINE content automation runbook

## Current deployment and persistence finding

The repository is linked to a Vercel project, but the checked configuration contains no database, KV, CMS or durable content-store settings. The only local deployment variable is Vercel's OIDC token. A Vercel function filesystem is not a durable content database, so the shipped `file` adapter is intentionally limited to local development or a self-hosted Node deployment with persistent disk.

On Vercel, a write attempt with the file adapter returns a configuration error instead of silently losing a draft. Before enabling a hosted scheduler, implement a `ContentStore` adapter with durable reads/writes and configure it with server-only environment variables. This repository does not select a cloud vendor on the owner's behalf.

## Default operating mode

- Schedule expression: `CONTENT_SCHEDULE="0 8 */2 * *"`.
- Mode: `CONTENT_MODE="draft"`.
- Auto publish: `AUTO_PUBLISH="false"`.
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

1. Implement and test a durable `ContentStore` adapter.
2. Add all server-only credentials to the deployment environment.
3. Enable protected administration and review the first draft-mode runs.
4. Set `CONTENT_MODE=publish` and `AUTO_PUBLISH=true`.
5. Configure the scheduler with the documented cron expression and bearer token.
6. Verify sitemap/RSS, metadata, JSON-LD, canonical URLs and source links after the first publication.

## Rollback

Set `AUTO_PUBLISH=false` and `CONTENT_MODE=draft`, disable the scheduler, then change the stored article status from `published` to `pending-review` in the durable store. Sitemap and RSS will remove that record on their next read. Do not delete source audit history.
