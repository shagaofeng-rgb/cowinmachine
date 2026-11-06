import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import { AdminShell } from "@/components/admin/AdminShell";
import { LeadFollowUpForm } from "@/components/admin/LeadFollowUpForm";
import { getLeadDetails } from "@/lib/admin-operations/analytics";
import { isAdminDatabaseConfigured } from "@/lib/admin-operations/database";
import { dateRangeSearchParams, readAdminDateRange } from "@/lib/admin-operations/date-range";
import { normalizeInquiryProductUrl } from "@/lib/inquiry-context";
import { getCategory } from "@/lib/products";
import { leadStatusLabels } from "@/types/admin-operations";
import { updateLeadFollowUp } from "./actions";

export const dynamic = "force-dynamic";

export default async function LeadPage({ params, searchParams }: {
  params: Promise<{ leadId: string }>;
  searchParams: Promise<{ preset?: string; start?: string; end?: string }>;
}) {
  if (!isAdminDatabaseConfigured()) notFound();
  const [{ leadId }, filters] = await Promise.all([params, searchParams]);
  const lead = await getLeadDetails(leadId);
  if (!lead) notFound();
  const range = readAdminDateRange(filters);
  const query = new URLSearchParams(dateRangeSearchParams(range)).toString();
  const product = normalizeInquiryProductUrl(lead.productUrl ?? "");
  const time = new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai" });
  const facts = [
    ["联系人", lead.name], ["邮箱", lead.email], ["电话 / WhatsApp", lead.whatsapp],
    ["询盘国家", lead.country], ["设备分类", getCategory(lead.category)?.name ?? lead.category],
    ["型号", lead.productModel], ["数量", lead.quantity], ["应用", lead.application], ["材料 / 介质", lead.material],
    ["流量渠道", lead.sourceChannel], ["首次记录页", lead.landingPath],
    ["产品来源", product ? <a key="product" href={product} target="_blank" rel="noreferrer">{new URL(product).pathname}</a> : null],
  ] as const;
  return <AdminShell active="/internal/admin/leads" range={range}>
    <header className="admin-topbar">
      <div><Link className="cw-link" href={`/internal/admin/leads?${query}`}><ArrowLeft size={16} aria-hidden="true" />询盘列表</Link>
        <h1>{lead.company}</h1><p>{time.format(new Date(lead.createdAt))} · {leadStatusLabels[lead.status] ?? lead.status}</p></div>
      {lead.customerId && <Link className="button button-outline" href={`/internal/admin/customers/${lead.customerId}?${query}`}>客户轨迹</Link>}
    </header>
    <div className="admin-grid-two">
      <section className="admin-panel">
        <div className="admin-panel-heading"><h2>询盘信息</h2></div>
        <dl className="admin-lead-info">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "未记录"}</dd></div>)}</dl>
        <h3>项目需求</h3><p className="admin-lead-message">{lead.message}</p>
        {lead.requirements && <p className="admin-lead-message">{lead.requirements}</p>}
      </section>
      <div>
        <section className="admin-panel">
          <div className="admin-panel-heading"><h2>记录跟进</h2></div>
          <LeadFollowUpForm action={updateLeadFollowUp.bind(null, leadId)} status={lead.status} />
        </section>
        <section className="admin-panel admin-journey-panel">
          <div className="admin-panel-heading"><h2>最近跟进记录</h2></div>
          {lead.activities.length ? <ol className="admin-journey-list">{lead.activities.map((item) => <li key={item.id}>
            <strong>{item.type === "created" ? "网站询盘已收到" : item.note}</strong>
            <time dateTime={item.date}>{time.format(new Date(item.date))}</time>
          </li>)}</ol> : <p className="admin-muted">暂无跟进记录。</p>}
        </section>
      </div>
    </div>
  </AdminShell>;
}
