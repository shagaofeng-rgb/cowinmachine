import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminDateFilters, AdminMetricCard, AdminPagination, AdminShell } from "@/components/admin/AdminShell";
import { listLeads } from "@/lib/admin-operations/analytics";
import { isAdminDatabaseConfigured } from "@/lib/admin-operations/database";
import { readAdminDateRange } from "@/lib/admin-operations/date-range";
import { contentAutomationConfig } from "@/lib/content-automation/config";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ preset?: string; start?: string; end?: string; page?: string; pageSize?: string; status?: string }> };
const labels: Record<string, string> = { new: "新询盘", qualified: "已初筛", "technical-review": "技术评审", "quotation-sent": "已报价", negotiation: "商务洽谈", won: "已成交", lost: "已流失", nurture: "持续跟进" };
function date(value: string) { return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(new Date(value)); }

export default async function LeadsPage({ searchParams }: Props) {
  const values = await searchParams; const config = contentAutomationConfig();
  if (!config.adminEnabled || !process.env.CONTENT_ADMIN_USER || !process.env.CONTENT_ADMIN_PASSWORD) notFound();
  const range = readAdminDateRange(values); const page = Math.max(1, Number(values.page ?? 1) || 1); const pageSize = [10, 25, 50, 100].includes(Number(values.pageSize)) ? Number(values.pageSize) : 25;
  if (!isAdminDatabaseConfigured()) return <AdminShell active="/internal/admin/leads" range={range}><header className="admin-topbar"><div><p className="eyebrow">销售运营</p><h1>询盘与 RFQ</h1><p>数据库连接后展示已保存的询盘与归属客户。</p></div></header><section className="admin-empty"><h2>需要数据库连接</h2><p>请配置持久化数据库并执行后台迁移。</p></section></AdminShell>;
  const leads = await listLeads(range, page, pageSize, values.status);
  return <AdminShell active="/internal/admin/leads" range={range}>
    <header className="admin-topbar"><div><p className="eyebrow">销售运营</p><h1>询盘与 RFQ</h1><p>按提交时间、状态和客户归属查看询盘；每页固定数量，避免长列表堆积。</p></div></header>
    <AdminDateFilters range={range} pathname="/internal/admin/leads" preserve={{ status: values.status }} />
    <section className="admin-metric-grid"><AdminMetricCard label="询盘总数" value={leads.total} detail={range.label} /><AdminMetricCard label="当前页" value={leads.page} detail={`共 ${leads.pageCount} 页`} /><AdminMetricCard label="产品已填" value={leads.rows.filter((item) => Boolean(item.productModel)).length} detail="当前页记录" /><AdminMetricCard label="已归属客户" value={leads.rows.filter((item) => Boolean(item.customerId)).length} detail="当前页记录" /></section>
    <section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">筛选</p><h2>询盘队列</h2></div></div>
      <form className="admin-inline-filter" action="/internal/admin/leads"><input type="hidden" name="preset" value={range.preset} /><input type="hidden" name="start" value={range.start.slice(0, 10)} /><input type="hidden" name="end" value={new Date(new Date(range.end).getTime() - 86400000).toISOString().slice(0, 10)} /><label>状态<select name="status" defaultValue={values.status ?? ""}><option value="">全部状态</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>每页条数<select name="pageSize" defaultValue={String(pageSize)}><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label><button className="button button-outline" type="submit">应用筛选</button></form>
      <div className="admin-table-wrap"><table><thead><tr><th>时间</th><th>公司 / 联系人</th><th>设备需求</th><th>国家</th><th>来源</th><th>状态</th><th>客户路径</th></tr></thead><tbody>{leads.rows.map((lead) => <tr key={lead.id}><td>{date(lead.createdAt)}</td><td><strong>{lead.company}</strong><span>{lead.name} · {lead.email}</span></td><td>{lead.productModel || lead.category}<span>{lead.application ?? "—"}</span></td><td>{lead.country}</td><td>{lead.sourceChannel ?? "直接访问 / 未知"}</td><td><span className="admin-status">{labels[lead.status] ?? lead.status}</span></td><td>{lead.customerId ? <Link href={`/internal/admin/customers/${lead.customerId}?preset=${range.preset}`}>查看全部路径</Link> : lead.visitorId ? <Link href={`/internal/admin/visitors/${lead.visitorId}?preset=${range.preset}`}>查看访客路径</Link> : "未关联"}</td></tr>)}{!leads.rows.length ? <tr><td colSpan={7} className="admin-empty-cell">当前筛选条件下没有询盘。</td></tr> : null}</tbody></table></div>
      <AdminPagination pathname="/internal/admin/leads" range={range} page={leads.page} pageCount={leads.pageCount} pageSize={leads.pageSize} total={leads.total} preserve={{ status: values.status }} />
    </section>
  </AdminShell>;
}
