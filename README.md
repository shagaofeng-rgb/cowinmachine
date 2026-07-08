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
- Sitemap: `/sitemap.xml`
- RSS: `/rss.xml`

## News Automation

Manual run:

```bash
curl -X POST http://localhost:3000/api/admin/news/run -H "x-cron-secret: $CRON_SECRET"
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
- External SEO sync, AI generation, email and webhook alerts require provider credentials.
- Demonstration News/Blog records are explicitly marked as examples and are not presented as real news.
