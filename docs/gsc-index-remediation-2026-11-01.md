# Search Console index remediation - 2026-11-01

Scope: `cowinmachine.com` only. Search Console data below was read on 2026-11-01; the indexing report's latest classification date was 2026-10-23. Counts and classifications are historical Google observations, not current HTTP results or a promise of indexing.

## Baseline

- Indexed: 276. Not indexed: 608.
- Submitted sitemap: Success, 564 discovered pages, last read 2026-10-31. The live sitemap had since grown to 565 due to one new blog article.
- Google-selected canonical for the home page was `https://www.cowinmachine.com/` (last crawl 2026-10-10), while the declared canonical used the apex host.
- Vercel runtime-log searches did not yield usable Googlebot access logs. Search Console crawl dates are used below; server-side crawl frequency cannot be independently claimed.

## URL and template disposition

| GSC classification | Observed URLs and last crawl | Decision / implemented action |
| --- | --- | --- |
| Discovered, not indexed (488) | 408 current product section URLs, 54 product roots, 11 `/products?page=n`, 8 category pagination URLs, 2 `/blog?page=n`, 1 blog article, 3 news articles, 1 `/solutions`. GSC shows no crawl date for this category. | The 408 section URLs repeated the product template. Their full content is now server-rendered in seven switchable panels on each canonical product root; old section URLs permanently redirect to the matching panel hash. Section URLs are removed from sitemap. The remaining product roots, pagination, articles, and solution page retain their distinct URLs and self-canonicals. Re-crawling, content-quality assessment, and indexing remain Google's decision. |
| Duplicate without user-selected canonical (48) | 43 historical packaging-product `/products/:slug` URLs, 4 `/contact?product=...` variants, 1 historical news URL; last crawls 2026-07-09 to 2026-08-02. Examples: `/products/380-coding-machine-widens-spray-paint-shell` (2026-08-02), `/products/99g-200g-500g-packaging-machine` (2026-08-01), `/contact?product=my-300ii-impress-or-solid-ink-coding-machine` (2026-07-30). | These are not equivalent to the current industrial equipment catalog. Unknown old product/category slugs now return 404 rather than a generic redirect to `/products`. Contact query variants remain canonical to `/contact`; query-specific pages are excluded from sitemap. Canonical metadata is absolute. No unrelated content was merged. |
| Crawled, not indexed (43) | Only 10 of 43 sample URLs could be retrieved in the GSC UI; last crawls 2026-07-18 to 2026-08-01. Samples are mostly historical packaging `/products/:slug`, one `/products/category/dosing-machine`, and one `/_next/static/chunks/...js?dpl=...`. Validation Failed 2026-09-15. | Historical unknown product/category paths now return a genuine 404 rather than a generic collection redirect. The static JS URL is not an indexable page. The other 33 URLs were not available from the UI export and must not be represented as audited individually. |
| Page with redirect (13) | Historical product/category paths including `/products/15`, `/products/conveyor`, `/products/category/locking-machine`, `/products/category/weigher`; HTTP `http://cowinmachine.com/` and `http://www.cowinmachine.com/`; `/resources`; and `https://www.cowinmachine.com/news`. Recent crawls 2026-10-22 to 2026-10-25 for several old products. Validation Failed 2026-09-05. | Unknown historical product/category paths no longer redirect to unrelated `/products`; they return 404. Intentional HTTP-to-HTTPS, `www`-to-apex, and `/resources`-to-`/news` redirects remain. The application `www` redirect is now explicit 301. Redirect sources are not in sitemap. Google will normally continue to report legitimate redirected URLs as non-indexed. |
| Not found (404) (3) | `https://www.cowinmachine.com/search` (2026-09-19), `https://www.cowinmachine.com/blog` (2026-08-17), `https://www.cowinmachine.com/products/continuous-film-sealing-machine` (2026-07-21). Validation Failed. | `/blog` now serves content on the apex canonical and `www` redirects there. `/search` and the unrelated historical packaging product remain 404; inventing a generic redirect would mislead users and search engines. |
| Excluded by noindex (9) | 3 incomplete configuration-review product stubs and 6 `/news?industry=...` filters. | Intentional exclusions; absent from sitemap. No blanket noindex change. |
| Alternate with proper canonical (3) | Quote/contact query variants. | Intentional canonical consolidation; no change. |
| Google chose another canonical (1) | Home page; last crawl 2026-10-10 selected `www`. | Canonical metadata uses the apex root and the sitemap uses `https://cowinmachine.com/`. Next.js renders the canonical without the optional root slash. The application-level `www` redirect is 301. Await Google's recrawl and re-evaluation. |

## Verification protocol

Run `python3 scripts/audit-indexable-sitemap.py` against production. It checks every sitemap URL for direct HTTP 200, absent `noindex`, and a self-canonical (treating the root URL with or without its optional slash as equivalent). Use `--sitemap http://localhost:3101/sitemap.xml --base-url http://localhost:3101` for the local production build. Also sample old product/category 404s, section redirects, apex/`www`, and the home canonical. A passed crawlability check is not proof that Google indexed the pages.

Search Console export of the 43 crawled-not-indexed URLs failed in the browser; only the first 10 were accessible. Search Console's historical counts will not update immediately after deployment. The 488 discovered URLs have no crawl dates, so there is no evidence yet that Google fetched their newly consolidated content.

## Local production-build checks

- `pnpm run test:site`: 9/9 passed; `pnpm run test:news`: 5/5 passed.
- `pnpm run build`: passed, including lint, TypeScript, public-boundary, content-similarity, and visual-usage checks.
- Local sitemap: 103/103 URL checks passed. The local data store has fewer published articles than production, so this is not a substitute for the production sitemap audit.
- Historical unknown product path `/products/380-coding-machine-widens-spray-paint-shell`: HTTP 404.
- Historical section path `/products/compressed-air-equipment/air-kszj18-17-183/applications`: HTTP 308 to the canonical product root with `#applications`.
- `www` host redirect: HTTP 301 to apex. The redirect target port is explicitly cleared in source for production.
