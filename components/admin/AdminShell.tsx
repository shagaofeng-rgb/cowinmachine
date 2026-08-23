import Link from "next/link";
import type { ReactNode } from "react";
import {
  ChartLineUp,
  FileText,
  Globe,
  House,
  MagnifyingGlass,
  Newspaper,
  Package,
  Robot,
  ShieldCheck,
  UsersThree,
} from "@phosphor-icons/react";
import { adminSections, type AdminDateRange } from "@/types/admin-operations";

const navIcons = {
  "/internal/admin": House,
  "/internal/admin/analytics": ChartLineUp,
  "/internal/admin/leads": UsersThree,
  "/internal/admin/products": Package,
  "/internal/admin/news": Newspaper,
  "/internal/admin/seo": MagnifyingGlass,
  "/internal/admin/markets": Globe,
  "/internal/admin/data-health": ShieldCheck,
  "/internal/content-operations": Robot,
} as const;

export function AdminShell({ active, range, children }: { active: string; range: AdminDateRange; children: ReactNode }) {
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <div className="admin-sidebar-top">
        <Link href="/internal/admin" className="admin-brand">
          <span>CM</span>
          <strong><b>COWIN</b> MACHINE</strong>
          <em>B2B 运营中心</em>
        </Link>
        <span className="admin-environment">私有后台</span>
      </div>
      <nav aria-label="后台导航" className="admin-navigation">
        <p>工作台</p>
        {adminSections.map((item) => {
          const Icon = navIcons[item.href as keyof typeof navIcons] ?? FileText;
          return <Link key={item.href} href={item.href} className={active === item.href ? "admin-nav-link admin-nav-link-active" : "admin-nav-link"}>
            <Icon size={18} weight={active === item.href ? "fill" : "regular"} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>;
        })}
      </nav>
      <div className="admin-sidebar-footer">
        <span className="admin-secure-mark"><ShieldCheck size={16} weight="fill" aria-hidden="true" />已受保护</span>
        <p>数据以第一方、访客同意为前提进行采集和保存。</p>
      </div>
    </aside>
    <div className="admin-main"><main className="admin-content">{children}</main></div>
  </div>;
}

export function AdminDateFilters({ range, pathname }: { range: AdminDateRange; pathname: string }) {
  return <form className="admin-date-filters" action={pathname}>
    <div className="admin-filter-caption"><ChartLineUp size={18} aria-hidden="true" /><span>数据视图</span></div>
    <label><span>日期范围</span><select name="preset" defaultValue={range.preset}>
      <option value="today">今日</option><option value="yesterday">昨日</option><option value="last-7-days">近 7 天</option><option value="last-30-days">近 30 天</option><option value="this-month">本月</option><option value="last-month">上月</option><option value="custom">自定义</option>
    </select></label>
    <label><span>开始日期</span><input type="date" name="start" defaultValue={range.start.slice(0, 10)} /></label>
    <label><span>结束日期</span><input type="date" name="end" defaultValue={new Date(new Date(range.end).getTime() - 86400000).toISOString().slice(0, 10)} /></label>
    <button className="button button-secondary" type="submit">更新数据</button>
  </form>;
}

export function AdminMetricCard({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return <article className="admin-metric-card">
    <div className="admin-metric-card-head"><p>{label}</p><span>实时汇总</span></div>
    <strong>{typeof value === "number" ? new Intl.NumberFormat("zh-CN").format(value) : value}</strong>
    <small>{detail}</small>
  </article>;
}
