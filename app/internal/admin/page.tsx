import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminDateFilters, AdminMetricCard, AdminShell } from "@/components/admin/AdminShell";
import { readAdminDateRange } from "@/lib/admin-operations/date-range";
import { getDashboardData, listLeads } from "@/lib/admin-operations/analytics";
import { isAdminDatabaseConfigured } from "@/lib/admin-operations/database";
import { contentAutomationConfig } from "@/lib/content-automation/config";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ preset?: string; start?: string; end?: string; page?: string; pageSize?: string; status?: string }> };

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
    <header className="admin-topbar"><div><p className="eyebrow">Private management</p><h1>Operations dashboard</h1><p>Connect the persistent PostgreSQL database before enabling analytics and lead storage.</p></div></header>
    <section className="admin-empty"><h2>Database connection required</h2><p>Set <code>DATABASE_URL</code> or <code>POSTGRES_URL</code> in the production environment, then run the supplied migration. Public website pages remain unaffected until first-party analytics consent is granted.</p></section>
  </AdminShell>;

  const [dashboard, leads] = await Promise.all([getDashboardData(range), listLeads(range, page, pageSize, status)]);

  return <AdminShell active="/internal/admin" range={range}>
    <header className="admin-topbar"><div><p className="eyebrow">Private management</p><h1>Operations dashboard</h1><p>{range.label} · first-party, consented traffic and inquiry data.</p></div><Link className="button button-primary" href="/request-a-quote">View public RFQ</Link></header>
    <AdminDateFilters range={range} pathname="/internal/admin" />

    <section className="admin-metric-grid" aria-label="Key performance metrics">
      <AdminMetricCard label="Unique visitors" value={dashboard.visitors} detail="Anonymous visitors in range" />
      <AdminMetricCard label="Sessions" value={dashboard.visits} detail="Page-view sessions" />
      <AdminMetricCard label="Product / content views" value={dashboard.pageViews} detail="Tracked page engagement" />
      <AdminMetricCard label="New inquiries" value={leads.total} detail="Stored RFQ records" />
      <AdminMetricCard label="Quote clicks" value={dashboard.quoteClicks} detail="Intent signal" />
      <AdminMetricCard label="WhatsApp clicks" value={dashboard.whatsappClicks} detail="Intent signal" />
    </section>

    <section className="admin-grid-two">
      <article className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Acquisition</p><h2>Traffic sources</h2></div><Link href="/internal/admin/analytics">Open analytics</Link></div>
        {dashboard.sources.length ? <ul className="admin-ranked-list">{dashboard.sources.map((item) => <li key={item.channel}><span>{item.channel.replaceAll("-", " ")}</span><strong>{item.sessions}</strong></li>)}</ul> : <p className="admin-muted">Data will appear after visitors accept analytics.</p>}
      </article>
      <article className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Markets</p><h2>Visitor countries</h2></div><Link href="/internal/admin/markets">Open markets</Link></div>
        {dashboard.countries.length ? <ul className="admin-ranked-list">{dashboard.countries.map((item) => <li key={item.country}><span>{item.country}</span><strong>{item.visitors}</strong></li>)}</ul> : <p className="admin-muted">Country-level data is derived by the hosting edge when available.</p>}
      </article>
      <article className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Products</p><h2>Most-viewed equipment</h2></div><Link href="/internal/admin/products">Open products</Link></div>
        {dashboard.products.length ? <ul className="admin-ranked-list">{dashboard.products.map((item) => <li key={`${item.category}-${item.slug}`}><span>{item.slug || item.category}</span><strong>{item.views}</strong></li>)}</ul> : <p className="admin-muted">Product interest appears when product detail pages are viewed.</p>}
      </article>
      <article className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Content</p><h2>Most-viewed pages</h2></div><Link href="/internal/admin/news">Open News</Link></div>
        {dashboard.topPages.length ? <ul className="admin-ranked-list">{dashboard.topPages.map((item) => <li key={item.pagePath}><span>{item.pagePath}</span><strong>{item.views}</strong></li>)}</ul> : <p className="admin-muted">No tracked page views in this range yet.</p>}
      </article>
    </section>

    <section className="admin-panel admin-leads-panel">
      <div className="admin-panel-heading"><div><p className="eyebrow">Sales operations</p><h2>Lead & RFQ queue</h2></div><Link href="/internal/admin/leads">Open all leads</Link></div>
      <form className="admin-inline-filter"><input type="hidden" name="preset" value={range.preset} /><input type="hidden" name="start" value={range.start.slice(0, 10)} /><input type="hidden" name="end" value={new Date(new Date(range.end).getTime() - 86400000).toISOString().slice(0, 10)} /><label>Status<select name="status" defaultValue={status ?? ""}><option value="">All statuses</option><option value="new">New</option><option value="qualified">Qualified</option><option value="technical-review">Technical review</option><option value="quotation-sent">Quotation sent</option><option value="negotiation">Negotiation</option><option value="won">Won</option><option value="lost">Lost</option><option value="nurture">Nurture</option></select></label><label>Rows<select name="pageSize" defaultValue={String(pageSize)}><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label><button className="button button-outline" type="submit">Filter</button></form>
      <div className="admin-table-wrap"><table><thead><tr><th>Received</th><th>Company / contact</th><th>Market</th><th>Equipment</th><th>Application</th><th>Source</th><th>Status</th></tr></thead><tbody>
        {leads.rows.length ? leads.rows.map((lead) => <tr key={lead.id}><td>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(lead.createdAt))}</td><td><strong>{lead.company}</strong><span>{lead.name}</span></td><td>{lead.country}</td><td>{lead.productModel || lead.category}</td><td>{lead.application || "—"}</td><td>{lead.sourceChannel || "Direct / unknown"}</td><td><span className="admin-status">{lead.status.replaceAll("-", " ")}</span></td></tr>) : <tr><td colSpan={7} className="admin-empty-cell">No inquiries match this date range and filter.</td></tr>}
      </tbody></table></div>
      <nav className="admin-pagination" aria-label="Lead pages"><span>{leads.total ? `${(leads.page - 1) * leads.pageSize + 1}–${Math.min(leads.page * leads.pageSize, leads.total)} of ${leads.total}` : "0 records"}</span><div><Link className={leads.page <= 1 ? "admin-page-disabled" : ""} aria-disabled={leads.page <= 1} href={`/internal/admin?${query(range, { page: leads.page - 1, pageSize, status })}`}>Previous</Link><span>Page {leads.page} of {leads.pageCount}</span><Link className={leads.page >= leads.pageCount ? "admin-page-disabled" : ""} aria-disabled={leads.page >= leads.pageCount} href={`/internal/admin?${query(range, { page: leads.page + 1, pageSize, status })}`}>Next</Link></div></nav>
    </section>
  </AdminShell>;
}
