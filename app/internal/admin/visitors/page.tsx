import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminDateFilters, AdminMetricCard, AdminPagination, AdminShell } from "@/components/admin/AdminShell";
import { listCustomers, listVisitors } from "@/lib/admin-operations/analytics";
import { isAdminDatabaseConfigured } from "@/lib/admin-operations/database";
import { readAdminDateRange } from "@/lib/admin-operations/date-range";
import { contentAutomationConfig } from "@/lib/content-automation/config";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ preset?: string; start?: string; end?: string; view?: string; page?: string; pageSize?: string; search?: string; country?: string; channel?: string; device?: string }> };

function number(value: string | undefined, fallback: number) {
  const result = Number(value);
  return Number.isFinite(result) && result > 0 ? Math.floor(result) : fallback;
}

function date(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(new Date(value));
}

export default async function VisitorsPage({ searchParams }: Props) {
  const values = await searchParams;
  const config = contentAutomationConfig();
  if (!config.adminEnabled || !process.env.CONTENT_ADMIN_USER || !process.env.CONTENT_ADMIN_PASSWORD) notFound();

  const range = readAdminDateRange(values);
  const view = values.view === "visitors" ? "visitors" : "customers";
  const page = number(values.page, 1);
  const pageSize = [10, 25, 50, 100].includes(number(values.pageSize, 25)) ? number(values.pageSize, 25) : 25;
  const ready = isAdminDatabaseConfigured();

  if (!ready) return <AdminShell active="/internal/admin/visitors" range={range}><header className="admin-topbar"><div><p className="eyebrow">客户路径</p><h1>访客与访问轨迹</h1><p>连接持久化数据库后，此模块会展示访客归属与完整访问旅程。</p></div></header><section className="admin-empty"><h2>需要数据库连接</h2><p>请先完成数据库连接和迁移。不会使用浏览器 LocalStorage 作为正式运营数据来源。</p></section></AdminShell>;

  const filters = { search: values.search, country: values.country, channel: values.channel, device: values.device };
  const [visitors, customers] = await Promise.all([
    view === "visitors" ? listVisitors(range, page, pageSize, filters) : Promise.resolve(null),
    view === "customers" ? listCustomers(range, page, pageSize, values.search) : Promise.resolve(null),
  ]);
  const result = view === "visitors" ? visitors! : customers!;

  return <AdminShell active="/internal/admin/visitors" range={range}>
    <header className="admin-topbar"><div><p className="eyebrow">客户归属</p><h1>访客与访问轨迹</h1><p>已识别客户会合并关联访客、询盘和页面访问；匿名访客保持独立，不会被推测性合并。</p></div></header>
    <AdminDateFilters range={range} pathname="/internal/admin/visitors" preserve={{ view, search: values.search, country: values.country, channel: values.channel, device: values.device }} />
    <section className="admin-metric-grid">
      <AdminMetricCard label="当前视图记录" value={result.total} detail={range.label} />
      <AdminMetricCard label="归属方式" value={view === "customers" ? "客户" : "匿名访客"} detail="第一方数据" />
      <AdminMetricCard label="路径事件" value="按详情查看" detail="最多显示 1,000 条" />
      <AdminMetricCard label="IP 处理" value="已脱敏" detail="不显示原始 IP" />
    </section>
    <nav className="admin-view-tabs" aria-label="访问记录类型">
      <Link className={view === "customers" ? "admin-view-tab active" : "admin-view-tab"} href="/internal/admin/visitors?view=customers">已识别客户</Link>
      <Link className={view === "visitors" ? "admin-view-tab active" : "admin-view-tab"} href="/internal/admin/visitors?view=visitors">匿名访客</Link>
    </nav>
    <section className="admin-panel">
      <div className="admin-panel-heading"><div><p className="eyebrow">查询与筛选</p><h2>{view === "customers" ? "客户归属列表" : "匿名访客列表"}</h2></div><span className="admin-muted">固定每页条数，支持页码跳转</span></div>
      <form className="admin-inline-filter" action="/internal/admin/visitors">
        <input type="hidden" name="preset" value={range.preset} /><input type="hidden" name="start" value={range.start.slice(0, 10)} /><input type="hidden" name="end" value={new Date(new Date(range.end).getTime() - 86400000).toISOString().slice(0, 10)} /><input type="hidden" name="view" value={view} />
        <label>搜索<input name="search" defaultValue={values.search ?? ""} placeholder={view === "customers" ? "公司、姓名或邮箱" : "访客编号、公司或邮箱"} /></label>
        {view === "visitors" ? <><label>国家<input name="country" defaultValue={values.country ?? ""} placeholder="例如 US" /></label><label>来源<select name="channel" defaultValue={values.channel ?? ""}><option value="">全部来源</option><option value="direct">直接访问</option><option value="organic-search">自然搜索</option><option value="paid">付费推广</option><option value="social">社交媒体</option><option value="referral">引荐</option><option value="ai-referral">AI 引荐</option></select></label><label>设备<select name="device" defaultValue={values.device ?? ""}><option value="">全部设备</option><option value="desktop">桌面端</option><option value="mobile">移动端</option><option value="tablet">平板</option></select></label></> : null}
        <label>每页条数<select name="pageSize" defaultValue={String(pageSize)}><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label><button className="button button-outline" type="submit">应用筛选</button>
      </form>
      <div className="admin-table-wrap"><table><thead>{view === "customers" ? <tr><th>客户</th><th>联系方式</th><th>国家</th><th>首次 / 最近访问</th><th>来源</th><th>访问者</th><th>页面浏览</th><th>询盘</th><th>详情</th></tr> : <tr><th>访客 ID</th><th>归属客户</th><th>国家 / 语言</th><th>设备</th><th>来源</th><th>会话</th><th>页面浏览</th><th>最近访问</th><th>详情</th></tr>}</thead><tbody>
        {view === "customers" ? customers!.rows.map((item) => <tr key={item.id}><td><strong>{item.company}</strong><span>{item.name}</span></td><td>{item.email}<span>{item.whatsapp ?? "—"}</span></td><td>{item.country}</td><td>{date(item.firstSeenAt)}<span>{date(item.lastSeenAt)}</span></td><td>{item.sourceChannel ?? "直接访问 / 未知"}</td><td>{item.visitorCount}</td><td>{item.pageViews}</td><td>{item.leadCount}</td><td><Link href={`/internal/admin/customers/${item.id}?preset=${range.preset}&start=${range.start.slice(0, 10)}&end=${new Date(new Date(range.end).getTime() - 86400000).toISOString().slice(0, 10)}`}>查看路径</Link></td></tr>) : visitors!.rows.map((item) => <tr key={item.visitorId}><td><code>{item.visitorId.slice(0, 12)}…</code></td><td>{item.customerId ? <Link href={`/internal/admin/customers/${item.customerId}?preset=${range.preset}`}>{item.customerCompany || item.customerName || "已归属客户"}</Link> : "匿名"}</td><td>{item.country ?? "未知"}<span>{item.language ?? "—"}</span></td><td>{item.device}</td><td>{item.firstChannel ?? "未知"}</td><td>{item.sessionCount}</td><td>{item.pageViews}</td><td>{date(item.lastSeenAt)}</td><td><Link href={`/internal/admin/visitors/${item.visitorId}?preset=${range.preset}&start=${range.start.slice(0, 10)}&end=${new Date(new Date(range.end).getTime() - 86400000).toISOString().slice(0, 10)}`}>查看路径</Link></td></tr>)}
        {!result.rows.length ? <tr><td className="admin-empty-cell" colSpan={9}>当前时间和筛选条件下没有可显示的记录。</td></tr> : null}
      </tbody></table></div>
      <AdminPagination pathname="/internal/admin/visitors" range={range} page={result.page} pageCount={result.pageCount} pageSize={result.pageSize} total={result.total} preserve={{ view, search: values.search, country: values.country, channel: values.channel, device: values.device }} />
    </section>
  </AdminShell>;
}
