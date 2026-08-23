import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminDateFilters, AdminMetricCard, AdminShell } from "@/components/admin/AdminShell";
import { readAdminDateRange } from "@/lib/admin-operations/date-range";
import { getDashboardData, listLeads } from "@/lib/admin-operations/analytics";
import { isAdminDatabaseConfigured } from "@/lib/admin-operations/database";
import { contentAutomationConfig } from "@/lib/content-automation/config";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ preset?: string; start?: string; end?: string; page?: string; pageSize?: string; status?: string }> };

const leadStatusLabels: Record<string, string> = {
  new: "新询盘", qualified: "已初筛", "technical-review": "技术评审", "quotation-sent": "已报价",
  negotiation: "商务洽谈", won: "已成交", lost: "已流失", nurture: "持续跟进",
};

function query(range: ReturnType<typeof readAdminDateRange>, values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams({ preset: range.preset, start: range.start.slice(0, 10), end: new Date(new Date(range.end).getTime() - 86400000).toISOString().slice(0, 10) });
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== "") params.set(key, String(value)); });
  return params.toString();
}

export default async function AdminOverviewPage({ searchParams }: Props) {
  const values = await searchParams;
  const config = contentAutomationConfig();
  if (!config.adminEnabled || !process.env.CONTENT_ADMIN_USER || !process.env.CONTENT_ADMIN_PASSWORD) notFound();

  const range = readAdminDateRange(values);
  const page = Math.max(1, Number(values.page ?? 1) || 1);
  const pageSize = [25, 50, 100].includes(Number(values.pageSize)) ? Number(values.pageSize) : 25;
  const status = values.status;
  const databaseReady = isAdminDatabaseConfigured();

  if (!databaseReady) return <AdminShell active="/internal/admin" range={range}>
    <header className="admin-topbar"><div><p className="eyebrow">私有管理</p><h1>运营数据总览</h1><p>启用访问统计和询盘存储前，请先连接持久化 PostgreSQL 数据库。</p></div></header>
    <section className="admin-empty"><h2>需要数据库连接</h2><p>请在生产环境中配置 <code>DATABASE_URL</code> 或 <code>POSTGRES_URL</code>，然后执行已提供的数据库迁移。只有访客明确同意后，才会收集第一方分析数据；公开网站不会受到影响。</p></section>
  </AdminShell>;

  const [dashboard, leads] = await Promise.all([getDashboardData(range), listLeads(range, page, pageSize, status)]);

  return <AdminShell active="/internal/admin" range={range}>
    <header className="admin-topbar"><div><p className="eyebrow">私有管理</p><h1>运营数据总览</h1><p>{range.label} · 第一方、已同意的流量和询盘数据。</p></div><Link className="button button-primary" href="/request-a-quote">查看公开 RFQ 表单</Link></header>
    <AdminDateFilters range={range} pathname="/internal/admin" />

    <section className="admin-metric-grid" aria-label="关键运营指标">
      <AdminMetricCard label="独立访客" value={dashboard.visitors} detail="日期范围内的匿名访客" />
      <AdminMetricCard label="访问会话" value={dashboard.visits} detail="页面访问会话" />
      <AdminMetricCard label="产品 / 内容浏览" value={dashboard.pageViews} detail="已记录的页面互动" />
      <AdminMetricCard label="新增询盘" value={leads.total} detail="已保存的 RFQ 记录" />
      <AdminMetricCard label="报价按钮点击" value={dashboard.quoteClicks} detail="采购意向信号" />
      <AdminMetricCard label="WhatsApp 点击" value={dashboard.whatsappClicks} detail="采购意向信号" />
    </section>

    <section className="admin-grid-two">
      <article className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">获客</p><h2>流量来源</h2></div><Link href="/internal/admin/analytics">打开流量分析</Link></div>
        {dashboard.sources.length ? <ul className="admin-ranked-list">{dashboard.sources.map((item) => <li key={item.channel}><span>{item.channel.replaceAll("-", " ")}</span><strong>{item.sessions}</strong></li>)}</ul> : <p className="admin-muted">访客同意统计后，数据会显示在这里。</p>}
      </article>
      <article className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">市场</p><h2>访客国家 / 地区</h2></div><Link href="/internal/admin/markets">打开市场分析</Link></div>
        {dashboard.countries.length ? <ul className="admin-ranked-list">{dashboard.countries.map((item) => <li key={item.country}><span>{item.country}</span><strong>{item.visitors}</strong></li>)}</ul> : <p className="admin-muted">国家 / 地区仅在托管边缘节点可提供时记录。</p>}
      </article>
      <article className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">产品</p><h2>浏览最多的设备</h2></div><Link href="/internal/admin/products">打开产品洞察</Link></div>
        {dashboard.products.length ? <ul className="admin-ranked-list">{dashboard.products.map((item) => <li key={`${item.category}-${item.slug}`}><span>{item.slug || item.category}</span><strong>{item.views}</strong></li>)}</ul> : <p className="admin-muted">产品详情页被浏览后，会显示采购兴趣。</p>}
      </article>
      <article className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">内容</p><h2>浏览最多的页面</h2></div><Link href="/internal/admin/news">打开新闻运营</Link></div>
        {dashboard.topPages.length ? <ul className="admin-ranked-list">{dashboard.topPages.map((item) => <li key={item.pagePath}><span>{item.pagePath}</span><strong>{item.views}</strong></li>)}</ul> : <p className="admin-muted">该日期范围内暂无页面浏览记录。</p>}
      </article>
    </section>

    <section className="admin-panel admin-leads-panel">
      <div className="admin-panel-heading"><div><p className="eyebrow">销售运营</p><h2>询盘与 RFQ 队列</h2></div><Link href="/internal/admin/leads">查看全部询盘</Link></div>
      <form className="admin-inline-filter"><input type="hidden" name="preset" value={range.preset} /><input type="hidden" name="start" value={range.start.slice(0, 10)} /><input type="hidden" name="end" value={new Date(new Date(range.end).getTime() - 86400000).toISOString().slice(0, 10)} /><label>状态<select name="status" defaultValue={status ?? ""}><option value="">全部状态</option><option value="new">新询盘</option><option value="qualified">已初筛</option><option value="technical-review">技术评审</option><option value="quotation-sent">已报价</option><option value="negotiation">商务洽谈</option><option value="won">已成交</option><option value="lost">已流失</option><option value="nurture">持续跟进</option></select></label><label>每页条数<select name="pageSize" defaultValue={String(pageSize)}><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label><button className="button button-outline" type="submit">筛选</button></form>
      <div className="admin-table-wrap"><table><thead><tr><th>收到时间</th><th>公司 / 联系人</th><th>市场</th><th>设备</th><th>应用</th><th>来源</th><th>状态</th></tr></thead><tbody>
        {leads.rows.length ? leads.rows.map((lead) => <tr key={lead.id}><td>{new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(new Date(lead.createdAt))}</td><td><strong>{lead.company}</strong><span>{lead.name}</span></td><td>{lead.country}</td><td>{lead.productModel || lead.category}</td><td>{lead.application || "—"}</td><td>{lead.sourceChannel || "直接访问 / 未知"}</td><td><span className="admin-status">{leadStatusLabels[lead.status] ?? lead.status}</span></td></tr>) : <tr><td colSpan={7} className="admin-empty-cell">此日期范围和筛选条件下没有询盘。</td></tr>}
      </tbody></table></div>
      <nav className="admin-pagination" aria-label="询盘分页"><span>{leads.total ? `${(leads.page - 1) * leads.pageSize + 1}–${Math.min(leads.page * leads.pageSize, leads.total)} / ${leads.total}` : "0 条记录"}</span><div><Link className={leads.page <= 1 ? "admin-page-disabled" : ""} aria-disabled={leads.page <= 1} href={`/internal/admin?${query(range, { page: leads.page - 1, pageSize, status })}`}>上一页</Link><span>第 {leads.page} / {leads.pageCount} 页</span><Link className={leads.page >= leads.pageCount ? "admin-page-disabled" : ""} aria-disabled={leads.page >= leads.pageCount} href={`/internal/admin?${query(range, { page: leads.page + 1, pageSize, status })}`}>下一页</Link></div></nav>
    </section>
  </AdminShell>;
}
