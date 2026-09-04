import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentOperationsControls } from "@/components/content-automation/ContentOperationsControls";
import { contentAutomationConfig } from "@/lib/content-automation/config";
import { getSearchConsoleStatus } from "@/lib/content-automation/search-console";
import {
  contentStore,
  getArticleChannel,
} from "@/lib/content-automation/storage";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ channel?: string }>;
};

export default async function ContentOperationsPage({ searchParams }: PageProps) {
  const config = contentAutomationConfig();
  if (!config.adminEnabled || !process.env.CONTENT_ADMIN_USER || !process.env.CONTENT_ADMIN_PASSWORD) notFound();

  const [state, searchConsole, filters] = await Promise.all([
    contentStore().read(),
    Promise.resolve(getSearchConsoleStatus()),
    searchParams,
  ]);
  const selected = filters.channel === "news" || filters.channel === "blog" ? filters.channel : "all";
  const filteredArticles = selected === "all"
    ? state.articles
    : state.articles.filter((article) => getArticleChannel(article) === selected);
  const published = filteredArticles.filter((article) => article.status === "published");
  const newsCount = state.articles.filter((article) => getArticleChannel(article) === "news").length;
  const blogCount = state.articles.filter((article) => getArticleChannel(article) === "blog").length;
  const failures = filteredArticles.flatMap((article) =>
    article.qualityReport.checks
      .filter((check) => !check.passed)
      .map((check) => article.title + ": " + check.name),
  );

  return (
    <section className="section">
      <div className="content-wrap">
        <p className="eyebrow">Private management</p>
        <h1>Content Operations</h1>
        <p>News automation and third-party Blog publishing use separate public channels while sharing protected operational monitoring.</p>

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
        </div>

        <ContentOperationsControls publishEnabled={config.mode === "publish" && config.adminPublishEnabled} />

        <section className="section">
          <h2>Failures and similarity reports</h2>
          {failures.length ? <ul>{failures.map((failure) => <li key={failure}>{failure}</li>)}</ul> : <p>No saved quality failures in this view.</p>}
        </section>

        <section>
          <h2>Publishing history</h2>
          {published.length ? (
            <ul>
              {published.map((article) => (
                <li key={article.id}>
                  <strong>{getArticleChannel(article) === "blog" ? "Blog" : "News"}:</strong> {article.title} — {article.discoveryStatus}
                </li>
              ))}
            </ul>
          ) : <p>No published articles in this view.</p>}
        </section>
      </div>
    </section>
  );
}
