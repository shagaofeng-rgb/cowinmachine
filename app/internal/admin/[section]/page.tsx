import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminDateFilters, AdminMetricCard, AdminShell } from "@/components/admin/AdminShell";
import { isAdminEnabled } from "@/lib/admin-operations/auth";
import { isAdminDatabaseConfigured } from "@/lib/admin-operations/database";
import { readAdminDateRange } from "@/lib/admin-operations/date-range";
import { getEditorialTraffic, getEquipmentInsights, getMarketInsights, getOperationsHealth } from "@/lib/admin-operations/insights";
import { getLatestSearchDiscovery } from "@/lib/content-automation/search-discovery-log";
import { getArticleChannel, getPublishedArticles } from "@/lib/content-automation/storage";
import { getCategory, getProduct } from "@/lib/products";
import type { AdminDateRange } from "@/types/admin-operations";

export const dynamic = "force-dynamic";

const sections = {
  products: { title: "产品洞察", description: "按设备分类和型号查看浏览量与关联询盘。" },
  news: { title: "News / Blog", description: "查看发布数量、浏览量和文章页询价点击。" },
  seo: { title: "SEO 中心", description: "最近一次 Google 提交、下载回执与 URL 检查结果。" },
  markets: { title: "市场与语言", description: "统计期内已同意且产生浏览的独立访客；每组最多显示前 10 项。" },
  "data-health": { title: "数据健康度", description: "查看数据库连接、最新入库时间和缺失关联。" },
} as const;

const time = new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" });
const showTime = (value?: Date | string | null) => value ? time.format(new Date(value)) : "暂无记录";

function Ranked({ title, rows }: { title: string; rows: Array<{ name: string; value: number; href?: string }> }) {
  return <section className="admin-panel">
    <div className="admin-panel-heading"><h2>{title}</h2></div>
    {rows.length ? <ul className="admin-ranked-list">{rows.map(({ name, value, href }) => <li key={href ?? name}>
      <span>{href ? <Link href={href}>{name}</Link> : name}</span><strong>{value}</strong>
    </li>)}</ul> : <p className="admin-muted">此日期范围内暂无记录。</p>}
  </section>;
}

async function ProductsReport({ range }: { range: AdminDateRange }) {
  const data = await getEquipmentInsights(range);
  return <>
    <section className="admin-metric-grid" aria-label="产品指标">
      <AdminMetricCard label="产品详情浏览" value={data.views} detail={range.label} />
      <AdminMetricCard label="被浏览型号数" value={data.models} detail={range.label} />
      <AdminMetricCard label="有型号的询盘" value={data.inquiries} detail="已保存记录" />
    </section>
    <div className="admin-grid-two">
      <Ranked title="分类浏览" rows={data.families.map((item) => ({ ...item, name: getCategory(item.name)?.name ?? item.name }))} />
      <Ranked title="型号浏览" rows={data.equipment.map((item) => {
        const product = getProduct(item.category, item.slug);
        return { name: product?.name ?? item.slug, value: item.value, href: product ? `/products/${item.category}/${item.slug}` : undefined };
      })} />
    </div>
  </>;
}

async function EditorialReport({ range }: { range: AdminDateRange }) {
  const [articles, traffic] = await Promise.all([getPublishedArticles(), getEditorialTraffic(range)]);
  const inRange = articles.filter((article) => {
    const published = Date.parse(article.publishedAt ?? "");
    return published >= Date.parse(range.start) && published < Date.parse(range.end);
  });
  const newsCount = inRange.filter((article) => getArticleChannel(article) === "news").length;
  return <>
    <section className="admin-metric-grid" aria-label="内容指标">
      <AdminMetricCard label="News 已发布" value={newsCount} detail={range.label} />
      <AdminMetricCard label="Blog 已发布" value={inRange.length - newsCount} detail={range.label} />
      <AdminMetricCard label="News 浏览" value={traffic.news} detail="已同意访客" />
      <AdminMetricCard label="Blog 浏览" value={traffic.blog} detail="已同意访客" />
      <AdminMetricCard label="文章页询价点击" value={traffic.quoteClicks} detail="不是入库询盘数" />
    </section>
    <section className="admin-panel"><div className="admin-panel-heading"><h2>发布状态</h2><Link href="/internal/content-operations">查看推送日志</Link></div>
      <p>News 自动采编已关闭；第三方 Blog 独立发布。</p>
    </section>
  </>;
}

async function SeoReport() {
  const last = await getLatestSearchDiscovery();
  const inspection = last?.inspections ?? [];
  const metrics = [
    ["计划提交", "每周一 10:30（北京时间）"],
    ["最近执行", showTime(last?.recordedAt)],
    ["提交响应", last?.submitHttpStatus ?? "暂无回执"],
    ["读回响应", last?.readbackHttpStatus ?? "暂无回执"],
    ["Google 下载（执行时记录）", showTime(last?.lastDownloaded)],
    ["处理状态（执行时记录）", last?.pending === true ? "待处理" : last?.pending === false ? "无待处理" : "未取得"],
    ["警告 / 错误", last?.warnings !== undefined && last.errors !== undefined ? `${last.warnings} / ${last.errors}` : "未取得"],
  ] as const;
  return <>
    <section className="admin-panel"><div className="admin-panel-heading"><h2>Sitemap 提交与下载</h2><a href="https://search.google.com/search-console/sitemaps?resource_id=sc-domain%3Acowinmachine.com" target="_blank" rel="noreferrer">Google 报告</a></div>
      <dl className="admin-lead-info">{metrics.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>
      <p className="admin-muted">提交成功不等于已收录。<Link href="/sitemap.xml">站点地图</Link> · <Link href="/robots.txt">抓取规则</Link></p>
    </section>
    <section className="admin-panel"><div className="admin-panel-heading"><h2>最近的 URL 检查</h2></div>
      {inspection.length ? <ul className="admin-journey-list">{inspection.map((item) => <li key={item.url}><strong>{item.url}</strong><span>{item.coverageState ?? item.verdict ?? "未取得 Google 状态"}</span><span>{showTime(item.lastCrawlTime)}</span></li>)}</ul> : <p className="admin-muted">暂无 URL 检查记录。</p>}
    </section>
  </>;
}

async function HealthReport() {
  const health = await getOperationsHealth();
  return <>
    <section className="admin-metric-grid" aria-label="数据完整性">
      <AdminMetricCard label="数据库读取" value="成功" detail="当前请求" />
      <AdminMetricCard label="未关联客户的询盘" value={health.unlinked} detail="全量检查" />
      <AdminMetricCard label="缺失创建记录的询盘" value={health.missingActivity} detail="全量检查" />
    </section>
    <section className="admin-panel"><div className="admin-panel-heading"><h2>同步与隐私</h2></div>
      <dl className="admin-lead-info">
        <div><dt>最新访客事件</dt><dd>{showTime(health.lastEvent)}</dd></div>
        <div><dt>最新询盘</dt><dd>{showTime(health.lastInquiry)}</dd></div>
        <div><dt>询盘防刷哈希</dt><dd>{process.env.ANALYTICS_IP_HASH_SECRET ? "已配置" : "未配置"}</dd></div>
      </dl>
      <p className="admin-muted">询盘独立入库；只有同意统计的访问才记录行为事件。后台不展示原始 IP。</p>
    </section>
  </>;
}

export default async function AdminSectionPage({ params, searchParams }: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ preset?: string; start?: string; end?: string }>;
}) {
  const [{ section }, values] = await Promise.all([params, searchParams]);
  if (!isAdminEnabled() || !Object.hasOwn(sections, section)) notFound();
  const info = sections[section as keyof typeof sections];
  const range = readAdminDateRange(values);
  const pathname = `/internal/admin/${section}`;
  const usesRange = section === "products" || section === "news" || section === "markets";
  const ready = isAdminDatabaseConfigured();
  return <AdminShell active={pathname} range={range}>
    <header className="admin-topbar"><div><h1>{info.title}</h1><p>{info.description}</p></div></header>
    {usesRange && <AdminDateFilters range={range} pathname={pathname} />}
    {!ready ? <section className="admin-empty"><h2>未连接数据库</h2><p>此页面不会将缺失的数据标为零。</p></section>
      : section === "products" ? <ProductsReport range={range} />
      : section === "news" ? <EditorialReport range={range} />
      : section === "seo" ? <SeoReport />
      : section === "markets" ? <div className="admin-grid-two admin-market-reports">{(await getMarketInsights(range)).map((report) => <Ranked key={report.title} {...report} />)}</div>
      : <HealthReport />}
  </AdminShell>;
}
