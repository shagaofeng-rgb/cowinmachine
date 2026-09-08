import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminDateFilters, AdminMetricCard, AdminShell } from "@/components/admin/AdminShell";
import { getVisitorJourney } from "@/lib/admin-operations/analytics";
import { readAdminDateRange } from "@/lib/admin-operations/date-range";
import { contentAutomationConfig } from "@/lib/content-automation/config";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ visitorId: string }>; searchParams: Promise<{ preset?: string; start?: string; end?: string }> };

function time(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(new Date(value));
}

export default async function VisitorJourneyPage({ params, searchParams }: Props) {
  const [{ visitorId }, values] = await Promise.all([params, searchParams]);
  const config = contentAutomationConfig();
  if (!config.adminEnabled || !process.env.CONTENT_ADMIN_USER || !process.env.CONTENT_ADMIN_PASSWORD) notFound();
  const range = readAdminDateRange(values);
  const data = await getVisitorJourney(visitorId, range);
  if (!data) notFound();

  return <AdminShell active="/internal/admin/visitors" range={range}>
    <header className="admin-topbar"><div><p className="eyebrow">访问详情</p><h1>{data.visitor.customerCompany || data.visitor.customerName || "匿名访客"}</h1><p>同一浏览器的第一方访问路径、会话与询盘关联。不会基于 IP 或推测性信息合并其他访客。</p></div><Link className="button button-outline" href="/internal/admin/visitors?view=visitors">返回访客列表</Link></header>
    <AdminDateFilters range={range} pathname={`/internal/admin/visitors/${visitorId}`} />
    <section className="admin-metric-grid"><AdminMetricCard label="访客标识" value={data.visitor.id.slice(0, 12) + "…"} detail="第一方匿名 ID" /><AdminMetricCard label="国家 / 地区" value={data.visitor.country ?? "未知"} detail={data.visitor.region ?? "—"} /><AdminMetricCard label="设备 / 语言" value={data.visitor.device} detail={data.visitor.language ?? "—"} /><AdminMetricCard label="会话数量" value={data.sessions.length} detail={range.label} /><AdminMetricCard label="路径事件" value={data.events.length} detail="最多显示 500 条" /><AdminMetricCard label="关联询盘" value={data.leads.length} detail="网站提交记录" /></section>
    <section className="admin-grid-two">
      <article className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">来源与设备</p><h2>会话记录</h2></div></div>{data.sessions.length ? <ul className="admin-journey-list">{data.sessions.map((session) => <li key={session.id}><strong>{session.channel}</strong><span>{time(session.startedAt)} · {session.landingPath ?? "—"}</span><small>{session.referrer ?? "直接访问"} · {session.device ?? "未知设备"} · {session.browser ?? "—"} / {session.os ?? "—"}</small></li>)}</ul> : <p className="admin-muted">当前时间范围内没有会话记录。</p>}</article>
      <article className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">询盘关联</p><h2>采购信号</h2></div></div>{data.leads.length ? <ul className="admin-journey-list">{data.leads.map((lead) => <li key={lead.id}><strong>{lead.productModel || lead.category}</strong><span>{lead.company} · {time(lead.createdAt)}</span><small>{lead.status}</small></li>)}</ul> : <p className="admin-muted">该访客尚未提交可关联的询盘。</p>}</article>
    </section>
    <section className="admin-panel admin-journey-panel"><div className="admin-panel-heading"><div><p className="eyebrow">完整访问路径</p><h2>页面与行为时间线</h2></div>{data.visitor.customerId ? <Link href={`/internal/admin/customers/${data.visitor.customerId}?preset=${range.preset}`}>查看客户全部路径</Link> : null}</div>
      {data.events.length ? <ol className="admin-timeline">{data.events.map((event) => <li key={event.id}><time>{time(event.occurredAt)}</time><div><strong>{event.eventName.replaceAll("_", " ")}</strong><p>{event.pageTitle || event.pagePath}</p><span>{event.pagePath}{event.productSlug ? ` · 产品：${event.productSlug}` : ""}</span></div></li>)}</ol> : <p className="admin-muted">当前时间范围内没有路径事件。</p>}
    </section>
  </AdminShell>;
}
