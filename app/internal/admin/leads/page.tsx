import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminDateFilters, AdminMetricCard, AdminPagination, AdminShell } from "@/components/admin/AdminShell";
import { listLeads } from "@/lib/admin-operations/analytics";
import { isAdminDatabaseConfigured } from "@/lib/admin-operations/database";
import { dateRangeSearchParams, readAdminDateRange } from "@/lib/admin-operations/date-range";
import { contentAutomationConfig } from "@/lib/content-automation/config";
import { normalizeInquiryProductUrl } from "@/lib/inquiry-context";
import { leadStatusLabels as labels } from "@/types/admin-operations";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ preset?: string; start?: string; end?: string; page?: string; pageSize?: string; status?: string; country?: string; source?: string }> };
const channels = [["direct", "直接访问"], ["organic-search", "自然搜索"], ["paid", "付费推广"], ["social", "社交媒体"], ["referral", "站外引荐"], ["ai-referral", "AI 引荐"], ["email", "邮件"], ["unknown", "未记录"]];
function date(value: string) { return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(new Date(value)); }

export default async function LeadsPage({ searchParams }: Props) {
  const values = await searchParams; const config = contentAutomationConfig();
  if (!config.adminEnabled || !process.env.CONTENT_ADMIN_USER || !process.env.CONTENT_ADMIN_PASSWORD) notFound();
  const range = readAdminDateRange(values); const page = Math.max(1, Number(values.page ?? 1) || 1); const pageSize = [10, 25, 50, 100].includes(Number(values.pageSize)) ? Number(values.pageSize) : 25;
  const dateParams = dateRangeSearchParams(range);
  const rangeQuery = new URLSearchParams(dateParams).toString();
  if (!isAdminDatabaseConfigured()) return <AdminShell active="/internal/admin/leads" range={range}><header className="admin-topbar"><div><p className="eyebrow">销售运营</p><h1>询盘与 RFQ</h1><p>数据库连接后展示已保存的询盘与归属客户。</p></div></header><section className="admin-empty"><h2>需要数据库连接</h2><p>请配置持久化数据库并执行后台迁移。</p></section></AdminShell>;
  const filters = { status: typeof values.status === "string" ? values.status : undefined, country: typeof values.country === "string" ? values.country : undefined, source: typeof values.source === "string" ? values.source : undefined };
  const leads = await listLeads(range, page, pageSize, filters.status, filters);
  return <AdminShell active="/internal/admin/leads" range={range}>
    <header className="admin-topbar"><div><p className="eyebrow">销售运营</p><h1>询盘与 RFQ</h1><p>按提交时间、状态和客户归属查看询盘；每页固定数量，避免长列表堆积。</p></div></header>
    <AdminDateFilters range={range} pathname="/internal/admin/leads" preserve={{ ...filters, pageSize: String(pageSize) }} />
    <section className="admin-metric-grid"><AdminMetricCard label="询盘总数" value={leads.total} detail={range.label} /><AdminMetricCard label="当前页" value={leads.page} detail={`共 ${leads.pageCount} 页`} /><AdminMetricCard label="产品已填" value={leads.rows.filter((item) => Boolean(item.productModel)).length} detail="当前页记录" /><AdminMetricCard label="已归属客户" value={leads.rows.filter((item) => Boolean(item.customerId)).length} detail="当前页记录" /></section>
    <section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">筛选</p><h2>询盘队列</h2></div></div>
      <form className="admin-inline-filter" action="/internal/admin/leads"><input type="hidden" name="preset" value={range.preset} /><input type="hidden" name="start" value={dateParams.start} /><input type="hidden" name="end" value={dateParams.end} /><label>状态<select name="status" defaultValue={filters.status ?? ""}><option value="">全部状态</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>询盘国家<input name="country" maxLength={100} defaultValue={filters.country ?? ""} /></label>
        <label>流量渠道<select name="source" defaultValue={filters.source ?? ""}><option value="">全部渠道</option>{channels.map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
        <label>每页条数<select name="pageSize" defaultValue={String(pageSize)}><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label><button className="button button-outline" type="submit">应用筛选</button></form>
      <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="询盘列表"><table>
        <thead><tr><th>时间</th><th>公司 / 联系人</th><th>设备需求</th><th>国家</th><th>来源</th><th>状态</th><th>客户路径</th></tr></thead>
        <tbody>{leads.rows.map((lead) => {
          const productUrl = normalizeInquiryProductUrl(lead.productUrl ?? "");
          return <tr key={lead.id}>
            <td>{date(lead.createdAt)}</td>
            <td><Link href={`/internal/admin/leads/${lead.id}?${rangeQuery}`}>{lead.company}</Link><span>{lead.name} · {lead.email}</span></td>
            <td>
              {lead.productModel && <strong>{lead.productModel}</strong>}
              <span>分类：{lead.category}</span>
              {lead.application && <span>{lead.application}</span>}
            </td>
            <td>{lead.country}</td>
            <td>
              {lead.sourceChannel ?? "未记录"}
              {lead.landingPath && <span>落地页：{lead.landingPath}</span>}
              <span style={{ overflowWrap: "anywhere" }}>产品来源：{productUrl
                ? <a href={productUrl} target="_blank" rel="noreferrer">{new URL(productUrl).pathname}</a>
                : "未记录"}</span>
            </td>
            <td><span className="admin-status">{labels[lead.status] ?? lead.status}</span></td>
            <td>{lead.customerId
              ? <Link href={`/internal/admin/customers/${lead.customerId}?${rangeQuery}`}>查看全部路径</Link>
              : lead.visitorId
                ? <Link href={`/internal/admin/visitors/${lead.visitorId}?${rangeQuery}`}>查看访客路径</Link>
                : "未关联"}</td>
          </tr>;
        })}{!leads.rows.length && <tr><td colSpan={7} className="admin-empty-cell">当前筛选条件下没有询盘。</td></tr>}</tbody>
      </table></div>
      <AdminPagination pathname="/internal/admin/leads" range={range} page={leads.page} pageCount={leads.pageCount} pageSize={leads.pageSize} total={leads.total} preserve={filters} />
    </section>
  </AdminShell>;
}
