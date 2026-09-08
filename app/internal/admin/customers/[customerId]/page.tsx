import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminDateFilters, AdminMetricCard, AdminShell } from "@/components/admin/AdminShell";
import { getCustomerJourney } from "@/lib/admin-operations/analytics";
import { readAdminDateRange } from "@/lib/admin-operations/date-range";
import { contentAutomationConfig } from "@/lib/content-automation/config";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ customerId: string }>; searchParams: Promise<{ preset?: string; start?: string; end?: string }> };

function time(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(new Date(value));
}

export default async function CustomerJourneyPage({ params, searchParams }: Props) {
  const [{ customerId }, values] = await Promise.all([params, searchParams]);
  const config = contentAutomationConfig();
  if (!config.adminEnabled || !process.env.CONTENT_ADMIN_USER || !process.env.CONTENT_ADMIN_PASSWORD) notFound();
  const range = readAdminDateRange(values);
  const data = await getCustomerJourney(customerId, range);
  if (!data) notFound();

  return <AdminShell active="/internal/admin/visitors" range={range}>
    <header className="admin-topbar"><div><p className="eyebrow">客户归属</p><h1>{data.customer.company}</h1><p>{data.customer.name} · {data.customer.email} · {data.customer.country}</p></div><Link className="button button-outline" href="/internal/admin/visitors?view=customers">返回客户列表</Link></header>
    <AdminDateFilters range={range} pathname={`/internal/admin/customers/${customerId}`} />
    <section className="admin-metric-grid"><AdminMetricCard label="首次识别" value={time(data.customer.firstSeenAt)} detail="提交询盘后归属" /><AdminMetricCard label="最近活动" value={time(data.customer.lastSeenAt)} detail={data.customer.sourceChannel ?? "直接访问 / 未知"} /><AdminMetricCard label="关联访客" value={data.visitors.length} detail="第一方浏览器标识" /><AdminMetricCard label="访问路径事件" value={data.events.length} detail={range.label} /><AdminMetricCard label="关联询盘" value={data.leads.length} detail="RFQ 记录" /><AdminMetricCard label="WhatsApp" value={data.customer.whatsapp ?? "未提供"} detail="客户联系人信息" /></section>
    <section className="admin-grid-two">
      <article className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">归属说明</p><h2>关联访客</h2></div></div>{data.visitors.length ? <ul className="admin-journey-list">{data.visitors.map((visitor) => <li key={visitor.id}><Link href={`/internal/admin/visitors/${visitor.id}?preset=${range.preset}`}><strong>{visitor.id.slice(0, 12)}…</strong></Link><span>{visitor.country ?? "未知"} · {visitor.device ?? "未知设备"} · {visitor.language ?? "—"}</span><small>{time(visitor.firstSeenAt)} 至 {time(visitor.lastSeenAt)}</small></li>)}</ul> : <p className="admin-muted">暂无关联浏览器访问记录。</p>}</article>
      <article className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">询盘历史</p><h2>采购需求</h2></div></div>{data.leads.length ? <ul className="admin-journey-list">{data.leads.map((lead) => <li key={lead.id}><strong>{lead.productModel || lead.category}</strong><span>{lead.application ?? "未提供应用信息"} · 数量：{lead.quantity ?? "未提供"}</span><small>{time(lead.createdAt)} · {lead.status}</small></li>)}</ul> : <p className="admin-muted">当前没有关联询盘。</p>}</article>
    </section>
    <section className="admin-panel admin-journey-panel"><div className="admin-panel-heading"><div><p className="eyebrow">客户访问详情</p><h2>全部关联访客的路径</h2></div></div>{data.events.length ? <ol className="admin-timeline">{data.events.map((event) => <li key={event.id}><time>{time(event.occurredAt)}</time><div><strong>{event.eventName.replaceAll("_", " ")}</strong><p>{event.pageTitle || event.pagePath}</p><span>{event.pagePath}{event.productSlug ? ` · 产品：${event.productSlug}` : ""}</span></div></li>)}</ol> : <p className="admin-muted">当前时间范围内没有访问事件。</p>}</section>
  </AdminShell>;
}
