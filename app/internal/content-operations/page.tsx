import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminDateFilters, AdminMetricCard, AdminPagination, AdminShell } from "@/components/admin/AdminShell";
import { dateRangeSearchParams, readAdminDateRange } from "@/lib/admin-operations/date-range";
import { getSearchConsoleStatus } from "@/lib/content-automation/search-console";
import { getRecentBlogWebhookEvents } from "@/lib/content-automation/inbound-publication-log";
import { contentStore, getArticleChannel } from "@/lib/content-automation/storage";
import { contentOperationsPerPage, getPageCount, paginateItems } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ channel?: string; page?: string; preset?: string; start?: string; end?: string }> };

export default async function ContentOperationsPage({ searchParams }: PageProps) {
  if (process.env.CONTENT_ADMIN_ENABLED !== "true" || !process.env.CONTENT_ADMIN_USER || !process.env.CONTENT_ADMIN_PASSWORD) notFound();

  const [state, searchConsole, filters, webhookEvents] = await Promise.all([
    contentStore().read(),
    getSearchConsoleStatus(),
    searchParams,
    getRecentBlogWebhookEvents(20),
  ]);
  const range = readAdminDateRange(filters);
  const selected = filters.channel === "news" || filters.channel === "blog" ? filters.channel : "all";
  const channelArticles = selected === "all" ? state.articles : state.articles.filter((article) => getArticleChannel(article) === selected);
  const filteredArticles = channelArticles.filter((article) => { const stamp = new Date(article.publishedAt ?? article.createdAt).getTime(); return stamp >= new Date(range.start).getTime() && stamp < new Date(range.end).getTime(); });
  const published = filteredArticles.filter((article) => article.status === "published");
  const pageCount = getPageCount(published.length, contentOperationsPerPage);
  const requestedPage = Number(filters.page);
  const page = Number.isSafeInteger(requestedPage) ? Math.min(pageCount, Math.max(1, requestedPage)) : 1;
  const visiblePublished = paginateItems(published, page, contentOperationsPerPage);
  const webhookPublished = webhookEvents.filter((event) => event.status === "published").length;
  const webhookRejected = webhookEvents.filter((event) => event.status === "rejected" || event.status === "failed").length;
  const failures = filteredArticles
    .flatMap((article) => article.qualityReport.checks.filter((check) => !check.passed).map((check) => article.title + ": " + check.name))
    .slice(0, contentOperationsPerPage);

  const pathname = "/internal/content-operations";
  const preserve = { channel: selected === "all" ? undefined : selected };
  const time = new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" });
  return <AdminShell active={pathname} range={range}>
    <header className="admin-topbar"><div><h1>内容发布与同步</h1><p>News 自动采编已关闭。第三方 Blog 使用独立的发布入口。</p></div></header>
    <AdminDateFilters range={range} pathname={pathname} preserve={preserve} />
    <section className="admin-metric-grid" aria-label="发布概况">
      <AdminMetricCard label="已发布内容" value={published.length} detail={range.label} />
      <AdminMetricCard label="Blog 推送成功" value={webhookPublished} detail="最近 20 次请求" />
      <AdminMetricCard label="Blog 拒绝或失败" value={webhookRejected} detail="最近 20 次请求" />
    </section>
    <section className="admin-panel">
      <div className="admin-panel-heading"><h2>发布记录</h2></div>
      <nav className="admin-view-tabs" aria-label="内容分类">
        {(["all", "news", "blog"] as const).map((channel) => {
          const query = new URLSearchParams({ ...dateRangeSearchParams(range), channel });
          return <Link key={channel} aria-current={selected === channel ? "page" : undefined} className={`admin-view-tab${selected === channel ? " active" : ""}`} href={`${pathname}?${query}`}>{channel === "all" ? "全部" : channel === "blog" ? "Blog" : "News"}</Link>;
        })}
      </nav>
      {visiblePublished.length ? <ul className="admin-ops-list">{visiblePublished.map((article) => <li key={article.id}><Link href={`/${getArticleChannel(article)}/${article.slug}`}>{article.title}</Link></li>)}</ul> : <p className="admin-muted">所选日期和频道内没有发布记录。</p>}
      <AdminPagination pathname={pathname} range={range} page={page} pageCount={pageCount} pageSize={contentOperationsPerPage} total={published.length} preserve={preserve} />
    </section>
    <section className="admin-panel"><div className="admin-panel-heading"><h2>第三方 Blog 推送</h2></div>
      {webhookEvents.length ? <ul className="admin-journey-list">{webhookEvents.map((event) => <li key={event.id}><strong>{event.status}</strong><time dateTime={event.occurredAt}>{time.format(new Date(event.occurredAt))}</time><span>标题 {event.titleLength} 字符 · 正文 {event.contentLength} 字符 · 图片 {event.imageStatus}{event.reason ? ` · ${event.reason}` : ""}</span></li>)}</ul> : <p className="admin-muted">暂无推送记录。</p>}
    </section>
    <section className="admin-panel"><div className="admin-panel-heading"><h2>Google 搜索提交</h2></div><p lang="en">{searchConsole.detail}</p></section>
    <section className="admin-panel"><div className="admin-panel-heading"><h2>内容质检</h2></div>{failures.length ? <ul className="admin-ops-list">{failures.map((failure, index) => <li key={`${index}-${failure}`}>{failure}</li>)}</ul> : <p className="admin-muted">所选范围内没有保存的质检失败记录。</p>}</section>
  </AdminShell>;
}
