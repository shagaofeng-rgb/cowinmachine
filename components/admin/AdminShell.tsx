import Link from "next/link";
import type { ReactNode } from "react";
import { adminSections, type AdminDateRange } from "@/types/admin-operations";

export function AdminShell({ active, range, children }: { active: string; range: AdminDateRange; children: ReactNode }) {
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <Link href="/internal/admin" className="admin-brand"><span>COWIN MACHINE</span><strong>B2B 运营后台</strong></Link>
      <nav aria-label="后台导航">
        {adminSections.map((item) => <Link key={item.href} href={item.href} className={active === item.href ? "admin-nav-link admin-nav-link-active" : "admin-nav-link"}>{item.label}</Link>)}
      </nav>
      <p className="admin-sidebar-note">私有工作区 · 所有流量数据均来自已同意的第一方统计。</p>
    </aside>
    <div className="admin-main">{children}</div>
  </div>;
}

export function AdminDateFilters({ range, pathname }: { range: AdminDateRange; pathname: string }) {
  return <form className="admin-date-filters" action={pathname}>
    <label><span>日期范围</span><select name="preset" defaultValue={range.preset}>
      <option value="today">今日</option><option value="yesterday">昨日</option><option value="last-7-days">近 7 天</option><option value="last-30-days">近 30 天</option><option value="this-month">本月</option><option value="last-month">上月</option><option value="custom">自定义</option>
    </select></label>
    <label><span>开始日期</span><input type="date" name="start" defaultValue={range.start.slice(0, 10)} /></label>
    <label><span>结束日期</span><input type="date" name="end" defaultValue={new Date(new Date(range.end).getTime() - 86400000).toISOString().slice(0, 10)} /></label>
    <button className="button button-secondary" type="submit">应用筛选</button>
  </form>;
}

export function AdminMetricCard({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return <article className="admin-metric-card"><p>{label}</p><strong>{typeof value === "number" ? new Intl.NumberFormat("zh-CN").format(value) : value}</strong><span>{detail}</span></article>;
}
