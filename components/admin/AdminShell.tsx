import Link from "next/link";
import type { ReactNode } from "react";
import { adminSections, type AdminDateRange } from "@/types/admin-operations";
import { dateRangeSearchParams } from "@/lib/admin-operations/date-range";

const navIcons: Record<string, AdminGlyphName> = {
  "/internal/admin": "home",
  "/internal/admin/visitors": "route",
  "/internal/admin/analytics": "chart",
  "/internal/admin/leads": "users",
  "/internal/admin/products": "box",
  "/internal/admin/news": "news",
  "/internal/admin/seo": "search",
  "/internal/admin/markets": "globe",
  "/internal/admin/data-health": "shield",
  "/internal/content-operations": "automation",
};

type AdminGlyphName = "home" | "chart" | "users" | "box" | "news" | "search" | "globe" | "shield" | "automation" | "route" | "file";

function AdminGlyph({ name, size = 18 }: { name: AdminGlyphName; size?: number }) {
  const paths: Record<AdminGlyphName, ReactNode> = {
    home: <><path d="m3 10.5 9-7 9 7" /><path d="M5.5 9.5v10h13v-10M9.5 19.5v-5h5v5" /></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    users: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="8" r="3" /><path d="M3 20c.5-3.5 2.5-5.2 6-5.2s5.5 1.7 6 5.2M14 15.2c3.5 0 5.5 1.7 6 4.8" /></>,
    box: <><path d="m3 7 9-4 9 4-9 4-9-4Z" /><path d="M3 7v10l9 4 9-4V7M12 11v10" /></>,
    news: <><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h4" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9S14.4 18.5 12 21M12 3c-2.4 2.5-3.6 5.5-3.6 9S9.6 18.5 12 21" /></>,
    shield: <><path d="M12 3 20 6v5.3c0 5-3.1 8.1-8 9.7-4.9-1.6-8-4.7-8-9.7V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-4.8" /></>,
    automation: <><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M12 4v3M8 12h.01M16 12h.01M8.5 16c1.8 1.2 5.2 1.2 7 0" /></>,
    route: <><circle cx="5" cy="5" r="2" /><circle cx="19" cy="19" r="2" /><path d="M7 5h4a4 4 0 0 1 4 4v2a4 4 0 0 0 4 4M5 7v7a5 5 0 0 0 5 5h7" /></>,
    file: <><path d="M6 3h8l4 4v14H6zM14 3v5h5M9 13h6M9 17h6" /></>,
  };
  return <svg className="admin-glyph" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function AdminShell({ active, range, children }: { active: string; range: AdminDateRange; children: ReactNode }) {
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <div className="admin-sidebar-top">
        <Link href="/internal/admin" className="admin-brand"><span>CM</span><strong><b>COWIN</b> MACHINE</strong><em>B2B 运营中心</em></Link>
        <span className="admin-environment">私有后台</span>
      </div>
      <nav aria-label="后台导航" className="admin-navigation"><p>工作台</p>{adminSections.map((item) => {
        const icon = navIcons[item.href] ?? "file";
        return <Link key={item.href} href={item.href} className={active === item.href ? "admin-nav-link admin-nav-link-active" : "admin-nav-link"}><AdminGlyph name={icon} /><span>{item.label}</span></Link>;
      })}</nav>
      <div className="admin-sidebar-footer"><span className="admin-secure-mark"><AdminGlyph name="shield" size={16} />已受保护</span><p>仅保存获得访客同意的第一方数据。原始 IP 不在后台显示。</p></div>
    </aside>
    <div className="admin-main"><main className="admin-content">{children}</main></div>
  </div>;
}

export function AdminDateFilters({ range, pathname, preserve = {} }: { range: AdminDateRange; pathname: string; preserve?: Record<string, string | undefined> }) {
  return <form className="admin-date-filters" action={pathname}>
    {Object.entries(preserve).map(([key, value]) => value ? <input type="hidden" key={key} name={key} value={value} /> : null)}
    <div className="admin-filter-caption"><AdminGlyph name="chart" /><span>数据范围</span></div>
    <label><span>时间</span><select name="preset" defaultValue={range.preset}><option value="today">今日</option><option value="this-week">本周</option><option value="this-month">本月</option><option value="custom">自定义</option></select></label>
    <label><span>开始日期</span><input type="date" name="start" defaultValue={dateRangeSearchParams(range).start} /></label>
    <label><span>结束日期</span><input type="date" name="end" defaultValue={dateRangeSearchParams(range).end} /></label>
    <button className="button button-secondary" type="submit">查询</button>
  </form>;
}

function withParams(pathname: string, values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== "") params.set(key, String(value)); });
  return \`${pathname}?${params.toString()}\`;
}

export function AdminPagination({ pathname, range, page, pageCount, pageSize, total, preserve = {} }: {
  pathname: string; range: AdminDateRange; page: number; pageCount: number; pageSize: number; total: number; preserve?: Record<string, string | undefined>;
}) {
  const base = { ...dateRangeSearchParams(range), ...preserve, pageSize };
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = total ? Math.min(page * pageSize, total) : 0;
  const shown = Array.from(new Set([1, 2, page - 1, page, page + 1, pageCount - 1, pageCount])).filter((item) => item >= 1 && item <= pageCount).sort((a, b) => a - b);
  return <nav className="admin-pagination" aria-label="数据分页">
    <span>{total ? \`${start}–${end} / ${total} 条\` : "0 条记录"}</span>
    <div><Link className={page <= 1 ? "admin-page-disabled" : ""} aria-disabled={page <= 1} href={withParams(pathname, { ...base, page: page - 1 })}>上一页</Link>
      {shown.map((item, index) => <span key={item}>{index > 0 && item - shown[index - 1] > 1 ? <i className="admin-page-gap">…</i> : null}<Link aria-current={item === page ? "page" : undefined} className={item === page ? "admin-page-current" : ""} href={withParams(pathname, { ...base, page: item })}>{item}</Link></span>)}
      <Link className={page >= pageCount ? "admin-page-disabled" : ""} aria-disabled={page >= pageCount} href={withParams(pathname, { ...base, page: page + 1 })}>下一页</Link>
    </div>
  </nav>;
}

export function AdminMetricCard({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return <article className="admin-metric-card"><div className="admin-metric-card-head"><p>{label}</p><span>{detail}</span></div><strong>{typeof value === "number" ? new Intl.NumberFormat("zh-CN").format(value) : value}</strong></article>;
}
