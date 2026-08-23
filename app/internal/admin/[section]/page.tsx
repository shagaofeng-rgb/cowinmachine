import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminDateFilters, AdminMetricCard, AdminShell } from "@/components/admin/AdminShell";
import { getDashboardData, listLeads } from "@/lib/admin-operations/analytics";
import { isAdminDatabaseConfigured } from "@/lib/admin-operations/database";
import { readAdminDateRange } from "@/lib/admin-operations/date-range";
import { contentAutomationConfig } from "@/lib/content-automation/config";

export const dynamic = "force-dynamic";

const sections = {
  analytics: { title: "Traffic analytics", description: "Consent-based acquisition, device, language, page and intent signals.", cards: ["Sessions", "Unique visitors", "Page views", "Quote clicks"] },
  leads: { title: "Leads & RFQ", description: "Website enquiries, qualification status, product context and source attribution.", cards: ["New inquiries", "Total records", "Quote clicks", "WhatsApp clicks"] },
  products: { title: "Product intelligence", description: "Which equipment categories and product references buyers actually review.", cards: ["Product views", "Top category", "Top product", "Inquiry context"] },
  news: { title: "News operations", description: "Published News, source rotation and content contribution to product exploration.", cards: ["Published articles", "News views", "Source rotation", "Content-to-RFQ"] },
  seo: { title: "SEO hub", description: "Search Console snapshots, sitemap state, canonical health and crawl follow-up.", cards: ["Sitemap health", "Search snapshots", "Index issues", "Technical checks"] },
  markets: { title: "Markets & languages", description: "Country, region, browser-language, device and traffic-channel segmentation.", cards: ["Countries", "Languages", "Desktop / mobile", "Returning visits"] },
  "data-health": { title: "Data health", description: "Consent status, database connection, event validation, retention and audit readiness.", cards: ["Database", "Consent model", "Event schema", "Data retention"] },
} as const;

type Props = { params: Promise<{ section: string }>; searchParams: Promise<{ preset?: string; start?: string; end?: string }> };

export default async function AdminSectionPage({ params, searchParams }: Props) {
  const { section } = await params;
  const values = await searchParams;
  const sectionInfo = sections[section as keyof typeof sections];
  const config = contentAutomationConfig();
  if (!sectionInfo || !config.adminEnabled || !process.env.CONTENT_ADMIN_USER || !process.env.CONTENT_ADMIN_PASSWORD) notFound();
  const range = readAdminDateRange(values);
  const databaseReady = isAdminDatabaseConfigured();
  const [dashboard, leads] = databaseReady ? await Promise.all([getDashboardData(range), listLeads(range)]) : [null, null];

  const cardValues: Record<string, number | string> = {
    Sessions: dashboard?.visits ?? "—", "Unique visitors": dashboard?.visitors ?? "—", "Page views": dashboard?.pageViews ?? "—", "Quote clicks": dashboard?.quoteClicks ?? "—",
    "New inquiries": leads?.total ?? "—", "Total records": leads?.total ?? "—", "WhatsApp clicks": dashboard?.whatsappClicks ?? "—",
    "Product views": dashboard?.products.reduce((total, item) => total + item.views, 0) ?? "—", "Top category": dashboard?.products[0]?.category ?? "—", "Top product": dashboard?.products[0]?.slug ?? "—", "Inquiry context": leads?.rows.filter((lead) => Boolean(lead.productModel)).length ?? "—",
    "Published articles": "Managed in News automation", "News views": dashboard?.topPages.filter((item) => item.pagePath.startsWith("/news")).reduce((total, item) => total + item.views, 0) ?? "—", "Source rotation": "Available in content operations", "Content-to-RFQ": "Tracked after sufficient data",
    "Sitemap health": "View sitemap / robots", "Search snapshots": "Connect Search Console", "Index issues": "Review Search Console", "Technical checks": "Canonical and 404 review",
    Countries: dashboard?.countries.length ?? "—", Languages: "Captured after consent", "Desktop / mobile": "Captured after consent", "Returning visits": "Available after return sessions",
    Database: databaseReady ? "Connected" : "Connection required", "Consent model": "First-party opt-in", "Event schema": "Validated", "Data retention": "IP hash only",
  };

  return <AdminShell active={`/internal/admin/${section}`} range={range}>
    <header className="admin-topbar"><div><p className="eyebrow">B2B operations</p><h1>{sectionInfo.title}</h1><p>{sectionInfo.description}</p></div><Link className="button button-outline" href="/internal/admin">Back to overview</Link></header>
    <AdminDateFilters range={range} pathname={`/internal/admin/${section}`} />
    <section className="admin-metric-grid">{sectionInfo.cards.map((label) => <AdminMetricCard key={label} label={label} value={cardValues[label]} detail={range.label} />)}</section>
    <section className="admin-panel"><p className="eyebrow">Implementation status</p><h2>{databaseReady ? "Data collection is active after visitor consent." : "This module is ready, pending database connection."}</h2>
      <p className="admin-muted">{section === "seo" ? "Search Console data is intentionally shown only after an authorized Google connection is configured. The dashboard will record source, date range, country, device, query and landing-page metrics without claiming guaranteed indexing." : section === "data-health" ? "Raw IP addresses are never exposed in reporting. When the hash secret is configured, an irreversible hash is used for security signals only; country and device analysis use minimised fields." : "Large datasets use indexed date ranges and server-side pagination. The dashboard defaults to 25 rows per page and supports 25, 50 or 100 rows."}</p>
    </section>
  </AdminShell>;
}
