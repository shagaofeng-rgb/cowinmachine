# COWIN MACHINE B2B Operations Admin

## Private access

The private workspace is available at `/internal/admin` only when these server environment variables are configured:

```text
CONTENT_ADMIN_ENABLED=true
CONTENT_ADMIN_USER=
CONTENT_ADMIN_PASSWORD=
DATABASE_URL= or POSTGRES_URL=
ANALYTICS_IP_HASH_SECRET=
```

Do not commit real values. `DATABASE_URL`, administrator credentials, and the IP-hash secret must be production-only environment variables.

## Storage model

- PostgreSQL is the persistent system of record for leads, consented anonymous sessions, events, SEO snapshots and audit logs.
- Browser cookies store only an anonymous visitor ID and the analytics preference.
- Visitor tracking begins only after the visitor selects **Allow analytics**.
- Raw IP addresses are never stored by the application. When `ANALYTICS_IP_HASH_SECRET` is configured, only a one-way hash is stored for security and duplicate-abuse signals.
- Country and region use hosting-edge request headers when available; no exact location is stored.

## Migration

Apply `lib/admin-operations/schema.sql` to the production Neon database through a reviewed migration. The migration only adds new tables and indexes.

## Retention defaults

- Anonymous analytics events: 13 months, then aggregate or delete.
- Raw inquiry records: retain only for the active sales and legal retention period approved by COWIN MACHINE.
- IP hashes: 30 days unless an active security incident requires a documented extension.
- SEO snapshots: 16 months.
- Admin audit logs: 13 months.

## Pagination

Lists default to 25 rows, with 50 and 100 available. Server-side date filtering and indexed pagination are required; never load an unbounded analytics or lead dataset into the browser.

## Search Console

Search Console data requires a separately authorized connection. Before that connection exists, the SEO dashboard must show **not configured**, not invented search, crawl, or index results.
