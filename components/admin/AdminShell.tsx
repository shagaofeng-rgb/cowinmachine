import Link from "next/link";
import type { ReactNode } from "react";
import { adminSections, type AdminDateRange } from "@/types/admin-operations";

export function AdminShell({ active, range, children }: { active: string; range: AdminDateRange; children: ReactNode }) {
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <Link href="/internal/admin" className="admin-brand"><span>COWIN MACHINE</span><strong>B2B Operations</strong></Link>
      <nav aria-label="Admin navigation">
        {adminSections.map((item) => <Link key={item.href} href={item.href} className={active === item.href ? "admin-nav-link admin-nav-link-active" : "admin-nav-link"}>{item.label}</Link>)}
      </nav>
      <p className="admin-sidebar-note">Private workspace · all traffic data uses first-party, consented analytics.</p>
    </aside>
    <div className="admin-main">{children}</div>
  </div>;
}

export function AdminDateFilters({ range, pathname }: { range: AdminDateRange; pathname: string }) {
  return <form className="admin-date-filters" action={pathname}>
    <label><span>Date range</span><select name="preset" defaultValue={range.preset}>
      <option value="today">Today</option><option value="yesterday">Yesterday</option><option value="last-7-days">Last 7 days</option><option value="last-30-days">Last 30 days</option><option value="this-month">This month</option><option value="last-month">Last month</option><option value="custom">Custom</option>
    </select></label>
    <label><span>From</span><input type="date" name="start" defaultValue={range.start.slice(0, 10)} /></label>
    <label><span>To</span><input type="date" name="end" defaultValue={new Date(new Date(range.end).getTime() - 86400000).toISOString().slice(0, 10)} /></label>
    <button className="button button-secondary" type="submit">Apply</button>
  </form>;
}

export function AdminMetricCard({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return <article className="admin-metric-card"><p>{label}</p><strong>{typeof value === "number" ? new Intl.NumberFormat("en-US").format(value) : value}</strong><span>{detail}</span></article>;
}
