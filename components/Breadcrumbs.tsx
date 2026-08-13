import Link from "next/link";
import type { Route } from "next";
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) { return <nav className="breadcrumbs" aria-label="Breadcrumb">{items.map((item, index) => <span key={item.label}>{index > 0 && " / "}{item.href ? <Link href={item.href as Route}>{item.label}</Link> : item.label}</span>)}</nav>; }
