import Link from "next/link";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { ContentOperationsControls } from "@/components/content-automation/ContentOperationsControls";
import { AdminDateFilters } from "@/components/admin/AdminShell";
import { readAdminDateRange } from "@/lib/admin-operations/date-range";
import { contentAutomationConfig } from "@/lib/content-automation/config";
import { getSearchConsoleStatus } from "@/lib/content-automation/search-console";
import { getRecentBlogWebhookEvents } from "@/lib/content-automation/inbound-publication-log";
import { contentStore, getArticleChannel } from "@/lib/content-automation/storage";
import { contentOperationsPerPage, getPageCount, paginateItems, resolvePage } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ channel?: string; page?: string; preset?: string; start?: string; end?: string }> };

export default async function ContentOperationsPage({ searchParams }: PageProps) {
  const config = contentAutomationConfig();
  if (!config.adminEnabled || !process.env.CONTENT_ADMIN_USER || !process.env.CONTENT_ADMIN_PASSWORD) notFound();

  const [state, searchConsole, filters, webhookEvents] = await Promise.all([
    contentStore().read(),
    Promise.resolve(getSearchConsoleStatus()),
    searchParams,
    getRecentBlogWebhookEvents(20),
  ]);
  const range = readAdminDateRange(filters);
  const selected = filters.channel === "news" || filters.channel === "blog" ? filters.channel : "all";
  const channelArticles = selected === "all" ? state.articles : state.articles.filter((article) => getArticleChannel(article) === selected);
  const filteredArticles = channelArticles.filter((article) => { const stamp = new Date(article.publishedAt ?? article.createdAt).getTime(); return stamp >= new Date(range.start).getTime() && stamp < new Date(range.end).getTime(); });
  const published = filteredArticles.filter((article) => article.status === "published");
  const pageCount = getPageCount(published.length, contentOperationsPerPage);
  const resolution = resolvePage(filters.page, pageCount);
  if (!resolution.valid) notFound();
  const visiblePublished = paginateItems(published, resolution.page, contentOperationsPerPage);
  const newsCount = state.articles.filter((article) => getArticleChannel(article) === "news").length;
  const blogCount = state.articles.filter((article) => getArticleChannel(article) === "blog").length;
  const webhookPublished = webhookEvents.filter((event) => event.status === "published").length;
  const webhookRejected = webhookEvents.filter((event) => event.status === "rejected" || event.status === "failed").length;
  const failures = filteredArticles
    .flatMap((article) => article.qualityReport.checks.filter((check) => !check.passed).map((check) => article.title + ": " + check.name))
    .slice(0, contentOperationsPerPage);

  return (
    <section className="section"><div className="content-wrap">
      <p className="eyebrow">Private management</p><h1>Content Operations</h1>
      <p>News automation and third-party Blog publishing use separate public channels while sharing protected operational monitoring.</p>
      <AdminDateFilters range={range} pathname="/internal/content-operations" preserve={{ channel: selected === "all" ? undefined : selected }} />
      <nav className="cta-row" aria-label="Content channel filter">
        <Link className={selected === "all" ? "button button-primary" : "button button-outline"} href="/internal/content-operations">All ({state.articles.length})</Link>
        <Link className={selected === "news" ? "button button-primary" : "button button-outline"} href="/internal/content-operations?channel=news">News ({newsCount})</Link>
        <Link className={selected === "blog" ? "button button-primary" : "button button-outline"} href="/internal/content-operations?channel=blog">Blog ({blogCount})</Link>
      </nav>
      <div className="grid">
        <article className="card"><h2>Article queue</h2><p>{filteredArticles.length} records in this view. Published: {published.length}.</p></article>
        <article className="card"><h2>Schedule</h2><p>{config.schedule} · {config.mode} mode · auto publish: {String(config.autoPublish)}</p></article>
        <article className="card"><h2>Discovery state</h2><p>Published News and Blog entries use separate public pages and RSS feeds, and both enter the dynamic sitemap.</p></article>
        <article className="card"><h2>Search Console</h2><p>{searchConsole.state}: {searchConsole.detail}</p></article>
        <article className="card"><h2>Third-party Blog sync</h2><p>{webhookPublished} published · {webhookRejected} rejected or failed · {webhookEvents.length} recent requests.</p></article>
      </div>
      <ContentOperationsControls publishEnabled={config.mode === "publish" && config.adminPublishEnabled} />
      <section className="section content-operations-section"><h2>Recent failures and similarity reports</h2>{failures.length ? <ul>{failures.map((failure) => <li key={failure}>{failure}</li>)}</ul> : <p>No saved quality failures in this view.</p>}</section>
      <section className="section content-operations-section"><h2>Third-party Blog webhook</h2><p>Validation requests do not create articles. Only requests marked “published” appear on the public Blog.</p>{webhookEvents.length ? <ul>{webhookEvents.map((event) => <li key={event.id}><strong>{event.status}</strong> · {new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.occurredAt))} · title {event.titleLength} characters · content {event.contentLength} characters · image: {event.imageStatus}{event.reason ? ` · ${event.reason}` : ""}</li>)}</ul> : <p>No third-party Blog requests have been recorded yet.</p>}</section>
      <section className="content-operations-section">
        <div className="catalog-section-heading"><div><h2>Publishing history</h2><p>Page {resolution.page} of {pageCount}. Each page shows up to {contentOperationsPerPage} published records.</p></div></div>
        {visiblePublished.length ? <ul>{visiblePublished.map((article) => <li key={article.id}><strong>{getArticleChannel(article) === "blog" ? "Blog" : "News"}:</strong> {article.title} - {article.discoveryStatus}</li>)}</ul> : <p>No published articles in this view.</p>}
        <Pagination basePath="/internal/content-operations" currentPage={resolution.page} totalPages={pageCount} query={selected === "all" ? undefined : { channel: selected }} ariaLabel="Publishing history pagination" />
      </section>
    </div></section>
  );
}
