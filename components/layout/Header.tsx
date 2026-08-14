"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";
import { productCategories } from "@/lib/products";
import { primaryNavigation, siteConfig } from "@/lib/site";
import { SiteLogo } from "@/components/layout/SiteLogo";

export function Header() {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const menuButton = menuButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown); menuButton?.focus(); };
  }, [open]);
  return <>
    <header className="site-header"><SiteLogo /><nav className="desktop-nav" aria-label="Primary navigation">{primaryNavigation.map((item) => <Link key={item.href} href={item.href as Route}>{item.label}</Link>)}</nav><div className="header-actions"><Link className="button button-primary" href="/request-a-quote">Get a Quote</Link><button ref={menuButtonRef} className="menu-button" type="button" aria-expanded={open} aria-controls="site-drawer" onClick={() => setOpen(true)}><span aria-hidden="true">☰</span> Menu</button></div></header>
    {open && <button className="drawer-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />}
    <aside ref={drawerRef} id="site-drawer" className={`site-drawer ${open ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="Site menu" tabIndex={-1}>
      <div className="drawer-top"><SiteLogo inverse onClick={() => setOpen(false)} /><button className="close-button" onClick={() => setOpen(false)} aria-label="Close menu">×</button></div>
      <details className="products-menu" open><summary>Products <span aria-hidden="true">+</span></summary>{productCategories.map((category, index) => <details key={category.slug} className="drawer-category"><summary><span>0{index + 1}</span><strong>{category.name}</strong></summary><div className="drawer-subcategory-links"><Link href={`/products/${category.slug}`} onClick={() => setOpen(false)}>View {category.name}</Link>{category.subcategories.map((item) => <span key={item}>{item}</span>)}</div></details>)}</details>
      <nav className="drawer-nav" aria-label="Menu navigation">{[...primaryNavigation.slice(1), { href: "/factory-quality", label: "Quality Documentation" }, { href: "/cases", label: "Project Reviews" }].map((item) => <Link key={item.href} href={item.href as Route} onClick={() => setOpen(false)}>{item.label}</Link>)}</nav>
      <div className="drawer-contact"><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a><a href={`https://wa.me/${siteConfig.whatsApp.replace(/\D/g, "")}`}>WhatsApp: {siteConfig.phone}</a><p>REVIEW REQUIRED: legal company address.</p><Link className="button button-primary" href="/request-a-quote" onClick={() => setOpen(false)}>Get a Quote</Link></div>
    </aside>
  </>;
}
