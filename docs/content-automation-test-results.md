# Content automation test results

Executed locally on 2026-08-14. The deployment was not changed.

| Check | Result | Evidence |
| --- | --- | --- |
| Data and queue validation | Pass | 6 eligible candidates, 3 research-ready topics, 3 saved review drafts, 0 published articles. |
| Scheduler dry run | Pass | Protected `/api/content-automation/run?dryRun=true` returned `drafted` without publishing. |
| Draft-mode generation | Pass | Three quality-passing records were saved as `pending-review`; no public article was created. |
| Duplicate-combination protection | Pass | After all three available research-ready combinations were saved, the next dry run returned `nothing-eligible`. |
| Sitemap validation | Pass | `/sitemap.xml` returned HTTP 200 and did not include a pending-review news URL. |
| RSS validation | Pass | `/feed.xml` returned valid XML with `COWIN MACHINE News`; it contained no draft item. |
| Protected management page | Pass | `/internal/content-operations` returned HTTP 404 with admin authentication disabled. |
| Structured-data validation | Pass with expected no-publish condition | Article, BreadcrumbList and conditional FAQPage generators are present. No Article JSON-LD is emitted until a record is actually published. |
| Lint, typecheck and production build | Pass | Next.js 16.3.0 production build completed successfully after the automation routes were added. |

## Notes

- The saved records are local `pending-review` state only. They are excluded from the public news list, sitemap and RSS feed.
- Automatic publication was not enabled for this test. `CONTENT_MODE` remained `draft` and `AUTO_PUBLISH` remained `false`.
- Search Console was not called because no configured credential pair or approved client adapter is present.
