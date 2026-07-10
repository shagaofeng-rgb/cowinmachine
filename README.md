# Lianteng B2B Website System

This repository contains a Next.js B2B packaging machinery website with a Chinese admin panel, persistent local database, product pages, News, Blog, inquiry forms, SEO/GEO output, RSS, Sitemap and a News automation task endpoint.

## Local Setup

```bash
pnpm install
cp .env.example .env.local
pnpm db:init
pnpm dev
```

Set `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD` before running `pnpm db:init` if you want an initial admin account.

## Main URLs

- Website: `/`
- Products: `/products`
- News: `/news`
- Blog: `/blog`
- Search: `/search`
- Contact form: `/contact`
- Chinese admin: `/admin`
- Health: `/api/health`
- Sitemap index: `https://cowinmachine.com/sitemap.xml`
- Split sitemaps: `https://cowinmachine.com/sitemaps/pages.xml`, `categories.xml`, `products.xml`, `posts.xml`
- RSS: `/rss.xml`

## Sitemap And Google Search Console

The sitemap system builds a Google-compliant sitemap index from public canonical pages only: static pages, published product categories, published products, News and Blog posts. Admin, search, URL-parameter pages, deleted rows, archived products and drafts are excluded. `lastmod` comes from each page's stored update/publication timestamp, not the current run time.

Manual commands:

```bash
pnpm sitemap:dry-run
pnpm sitemap:generate -- --verbose
pnpm sitemap:generate -- --submit --verbose
pnpm sitemap:generate -- --output-dir ./tmp/sitemap
```

Vercel runs the daily sitemap check through `/api/admin/sitemap/run`. Set `CRON_SECRET`; Vercel sends it as `Authorization: Bearer $CRON_SECRET`. The admin panel can also run the job after login.

Google Search Console submission is optional and disabled unless explicitly enabled:

```env
SITE_URL=https://cowinmachine.com
GOOGLE_SEARCH_CONSOLE_ENABLED=true
GOOGLE_SEARCH_CONSOLE_SITE_URL=sc-domain:cowinmachine.com
GOOGLE_SEARCH_CONSOLE_SITEMAP_URL=https://cowinmachine.com/sitemap.xml
GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_PATH=/secure/path/service-account.json
```

The legacy inline env names are also supported: `GSC_SITE_URL`, `GSC_CLIENT_EMAIL`, `GSC_PRIVATE_KEY`. Do not commit the service account JSON or private key. Grant the service account email Owner or Full user access in Google Search Console for the `cowinmachine.com` domain property before enabling submission.

Logs are stored in `sitemap_runs` and shown in `/admin` under “Sitemap 自动生成”. The log includes trigger, timing, files, URL count, skipped/error counts, split status, diff summary and GSC result.

Troubleshooting:

- Sitemap 404: verify the deployment includes `app/sitemap.xml/route.ts` and `app/sitemaps/[name]/route.ts`.
- XML error: run `pnpm sitemap:dry-run`; generation validates XML before writing files.
- `robots.txt` missing sitemap: check `https://cowinmachine.com/robots.txt` and redeploy.
- API 403: confirm the service account has access to the Search Console property and the property string matches `sc-domain:cowinmachine.com`.
- Submitted but not indexed: sitemap submission only helps Google discover URLs. Crawling and indexing still depend on Google Search Console status and page quality.

## News Automation

Manual run:

```bash
curl -X POST http://localhost:3000/api/admin/news/run -H "Authorization: Bearer $CRON_SECRET"
```

Without real `NEWS_API_KEY`, RSS source configuration or AI credentials, the automation records a blocked/failed job instead of inventing real news. For local workflow validation only, set `NEWS_TEST_MODE=1`.

## Tests

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm self-check
```

## Environment Variables

See `.env.example`. Do not commit real secrets.

## Backup And Restore

Local SQLite backup:

```bash
mkdir -p backups
cp data/site.db backups/site-$(date +%Y%m%d%H%M%S).db
```

Restore:

```bash
cp backups/site-YYYYMMDDHHMMSS.db data/site.db
```

For production PostgreSQL, use `pg_dump` and `pg_restore` with managed backups.

## Known Limits

- SQLite is suitable for local development and simple single-node deployment. For Vercel production, configure a managed PostgreSQL database and adapt the data access layer.
- When deployed to Vercel without `DATABASE_PATH`, the app uses `/tmp/site.db` so pages can render in Serverless runtime. This is suitable for content preview, but not durable production business data.
- External SEO sync, AI generation, email and webhook alerts require provider credentials.
- Demonstration News/Blog records are explicitly marked as examples and are not presented as real news.
