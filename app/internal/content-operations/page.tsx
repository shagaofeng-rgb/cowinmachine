import { notFound } from "next/navigation";
import { ContentOperationsControls } from "@/components/content-automation/ContentOperationsControls";
import { contentAutomationConfig } from "@/lib/content-automation/config";
import { getSearchConsoleStatus } from "@/lib/content-automation/search-console";
import { contentStore } from "@/lib/content-automation/storage";

export const dynamic = "force-dynamic";

export default async function ContentOperationsPage() {
  const config = contentAutomationConfig();
  if (!config.adminEnabled || !process.env.CONTENT_ADMIN_USER || !process.env.CONTENT_ADMIN_PASSWORD) notFound();
  const [state, searchConsole] = await Promise.all([contentStore().read(), Promise.resolve(getSearchConsoleStatus())]);
  const failures = state.articles.flatMap((article) => article.qualityReport.checks.filter((check) => !check.passed).map((check) => `${article.title}: ${check.name}`));
  return <section className="section"><div className="content-wrap"><p className="eyebrow">Private management</p><h1>Content Operations</h1><p>Visibility is protected by environment-backed basic authentication. This page is unavailable when authentication is not configured.</p><div className="grid"><article className="card"><h2>Article queue</h2><p>{state.articles.length} saved automation records. Published: {state.articles.filter((article) => article.status === "published").length}.</p></article><article className="card"><h2>Schedule</h2><p>{config.schedule} · {config.mode} mode · auto publish: {String(config.autoPublish)}</p></article><article className="card"><h2>Sitemap state</h2><p>Published entries are added to the dynamic sitemap and RSS feed. Drafts remain excluded.</p></article><article className="card"><h2>Search Console</h2><p>{searchConsole.state}: {searchConsole.detail}</p></article></div><ContentOperationsControls publishEnabled={config.mode === "publish" && config.adminPublishEnabled} /><section className="section"><h2>Failures and similarity reports</h2>{failures.length ? <ul>{failures.map((failure) => <li key={failure}>{failure}</li>)}</ul> : <p>No saved quality failures. Run history and future source usage are stored with the content state.</p>}</section><section><h2>Publishing history</h2>{state.articles.filter((article) => article.status === "published").length ? <ul>{state.articles.filter((article) => article.status === "published").map((article) => <li key={article.id}>{article.title} — {article.discoveryStatus}</li>)}</ul> : <p>No article has been published by this system.</p>}</section></div></section>;
}
