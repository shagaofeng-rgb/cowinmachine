import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminDateFilters, AdminMetricCard, AdminPagination, AdminShell } from "@/components/admin/AdminShell";
import { getDashboardData, listAnalyticsEvents } from "@/lib/admin-operations/analytics";
import { isAdminDatabaseConfigured } from "@/lib/admin-operations/database";
import { readAdminDateRange } from "@/lib/admin-operations/date-range";
import { contentAutomationConfig } from "@/lib/content-automation/config";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ preset?: string; start?: string; end?: string; page?: string; pageSize?: string; source?: string; country?: string; device?: string; language?: string; event?: string; search?: string }> };
function time(value: string) { return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(new Date(value)); }

export default async function AnalyticsPage({ searchParams }: Props) {
  const values = await searchParams; const config = contentAutomationConfig();
  if (!config.adminEnabled || !process.env.CONTENT_ADMIN_USER || !process.env.CONTENT_ADMIN_PASSWORD) notFound();
  const range = readAdminDateRange(values); const page = Math.max(1, Number(values.page ?? 1) || 1); const pageSize = [10, 25, 50, 100].includes(Number(values.pageSize)) ? Number(values.pageSize) : 25;
  if (!isAdminDatabaseConfigured()) return <AdminShell active="/internal/admin/analytics" range={range}><header className="admin-topbar"><div><p className="eyebrow">流量分析</p><h1>流量来源与访问行为</h1><p>数据库连接后显示已同意访客的第一方访问数据。</p></div></header><section className="admin-empty"><h2>需要数据库连接</h2><p>不会将浏览器临时存储作为正式运营报表数据源。</p></section></AdminShell>;
  const filters = { source: values.source, country: values.country, device: values.device, language: values.language, event: values.event, search: values.search };
  const [dashboard, events] = await Promise.all([getDashboardData(range), listAnalyticsEvents(range, page, pageSize, filters)]);
  return <AdminShell active="/internal/admin/analytics" range={range}>
    <header className="admin-topbar"><div><p className="eyebrow">第一方数据</p><h1>流量来源与访问行为</h1><p>按渠道、国家、语言、设备、访问行为和产品路径筛选。IP 仅作为不可逆安全哈希使用，后台不展示原始 IP。</p></div><Link className="button button-outline" href="/internal/admin/visitors">查看客户轨迹</Link></header>
    <AdminDateFilters range={range} pathname="/internal/admin/analytics" preserve={filters} />
    <section className="admin-metric-grid"><AdminMetricCard label="独立访客" value={dashboard.visitors} detail={range.label} /><AdminMetricCard label="访问会话" value={dashboard.visits} detail="页面会话" /><AdminMetricCard label="页面浏览" value={dashboard.pageViews} detail="已同意访客" /><AdminMetricCard label="报价点击" value={dashboard.quoteClicks} detail="采购信号" /><AdminMetricCard label="WhatsApp 点击" value={dashboard.whatsappClicks} detail="采购信号" /><AdminMetricCard label="事件记录" value={events.total} detail="当前筛选" /></section>
    <section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">筛选查询</p><h2>访问事件明细</h2></div><span className="admin-muted">固定分页，避免大量事件堆叠。</span></div>
      <form className="admin-inline-filter" action="/internal/admin/analytics"><input type="hidden" name="preset" value={range.preset} /><input type="hidden" name="start" value={range.start.slice(0, 10)} /><input type="hidden" name="end" value={new Date(new Date(range.end).getTime() - 86400000).toISOString().slice(0, 10)} />
        <label>页面 / 产品<input name="search" defaultValue={values.search ?? ""} placeholder="URL、标题或产品" /></label><label>来源<select name="source" defaultValue={values.source ?? ""}><option value="">全部来源</option><option value="direct">直接访问</option><option value="organic-search">自然搜索</option><option value="paid">付费推广</option><option value="social">社交媒体</option><option value="referral">引荐</option><option value="ai-referral">AI 引荐</option></select></label><label>国家<input name="country" defaultValue={values.country ?? ""} placeholder="例如 US" /></label><label>设备<select name="device" defaultValue={values.device ?? ""}><option value="">全部设备</option><option value="desktop">桌面端</option><option value="mobile">移动端</option><option value="tablet">平板</option></select></label><label>语言<input name="language" defaultValue={values.language ?? ""} placeholder="例如 en-US" /></label><label>行为<select name="event" defaultValue={values.event ?? ""}><option value="">全部行为</option><option value="page_view">页面浏览</option><option value="product_view">产品浏览</option><option value="news_view">内容浏览</option><option value="quote_click">报价点击</option><option value="whatsapp_click">WhatsApp 点击</option><option value="email_click">邮件点击</option><option value="inquiry_submitted">提交询盘</option></select></label><label>每页条数<select name="pageSize" defaultValue={String(pageSize)}><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label><button className="button button-outline" type="submit">应用筛选</button>
      </form>
      <div className="admin-table-wrap"><table><thead><tr><th>时间</th><th>行为 / 页面</th><th>产品</th><th>来源</th><th>国家 / 语言</th><th>设备 / 浏览器</th><th>访客路径</th></tr></thead><tbody>{events.rows.map((item) => <tr key={item.id}><td>{time(item.occurredAt)}</td><td><strong>{item.eventName.replaceAll("_", " ")}</strong><span>{item.pageTitle || item.pagePath}</span></td><td>{item.product ?? "—"}</td><td>{item.channel}</td><td>{item.country ?? "未知"}<span>{item.language ?? "—"}</span></td><td>{item.device ?? "未知"}<span>{item.browser ?? "—"}</span></td><td><Link href={`/internal/admin/visitors/${item.visitorId}?preset=${range.preset}`}>查看路径</Link></td></tr>)}{!events.rows.length ? <tr><td className="admin-empty-cell" colSpan={7}>当前筛选条件下没有访问事件。</td></tr> : null}</tbody></table></div>
      <AdminPagination pathname="/internal/admin/analytics" range={range} page={events.page} pageCount={events.pageCount} pageSize={events.pageSize} total={events.total} preserve={filters} />
    </section>
  </AdminShell>;
}
