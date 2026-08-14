"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ProductsMegaDrawer } from "@/components/layout/products-mega-drawer";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { SiteMenuDrawer } from "@/components/layout/site-menu-drawer";
import { desktopNavigation } from "@/lib/navigation";

type DrawerName = "products" | "menu" | null;
const focusableSelector = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";
function GridIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>; }
function ChevronIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>; }
function MenuIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>; }

export function SiteHeader() {
  const pathname = usePathname(); const [drawer, setDrawer] = useState<DrawerName>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const productsButtonRef = useRef<HTMLButtonElement>(null); const menuButtonRef = useRef<HTMLButtonElement>(null); const productsDialogRef = useRef<HTMLElement>(null); const menuDialogRef = useRef<HTMLElement>(null); const menuCloseButtonRef = useRef<HTMLButtonElement>(null); const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const closeDrawer = (returnFocus = true) => { setDrawer(null); if (returnFocus) requestAnimationFrame(() => returnFocusRef.current?.focus()); };
  const toggleDrawer = (next: Exclude<DrawerName, null>, trigger: HTMLButtonElement | null) => { if (drawer === next) { closeDrawer(); return; } returnFocusRef.current = trigger; setDrawer(next); };
  useEffect(() => { const frame = requestAnimationFrame(() => setDrawer(null)); return () => cancelAnimationFrame(frame); }, [pathname]);
  useEffect(() => { const updateScrolled = () => setIsScrolled(window.scrollY > 4); updateScrolled(); window.addEventListener("scroll", updateScrolled, { passive: true }); return () => window.removeEventListener("scroll", updateScrolled); }, []);
  useEffect(() => { if (!drawer) return; const activeDialog = drawer === "products" ? productsDialogRef.current : menuDialogRef.current; const previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; const initialFocus = drawer === "menu" ? menuCloseButtonRef.current : activeDialog?.querySelector<HTMLElement>(focusableSelector); requestAnimationFrame(() => initialFocus?.focus()); const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); closeDrawer(); return; } if (event.key !== "Tab" || !activeDialog) return; const items = [...activeDialog.querySelectorAll<HTMLElement>(focusableSelector)]; if (!items.length) return; const first = items[0]; const last = items[items.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }; window.addEventListener("keydown", onKeyDown); return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown); }; }, [drawer]);
  return <><header className={`site-header${isScrolled ? " scrolled" : ""}`}><SiteLogo /><nav className="desktop-nav" aria-label="Primary navigation">{desktopNavigation.slice(0, 1).map((item) => <Link key={item.href} className={pathname === item.href ? "nav-link nav-link-active" : "nav-link"} href={item.href}>{item.label}</Link>)}<button ref={productsButtonRef} className={`products-nav-button${drawer === "products" || pathname.startsWith("/products") ? " nav-link-active" : ""}`} type="button" aria-expanded={drawer === "products"} aria-controls="products-mega-drawer" onClick={(event) => toggleDrawer("products", event.currentTarget)}><GridIcon /><span>Products</span><span className={`products-chevron${drawer === "products" ? " products-chevron-open" : ""}`}><ChevronIcon /></span></button>{desktopNavigation.slice(1).map((item) => <Link key={item.href} className={pathname === item.href ? "nav-link nav-link-active" : "nav-link"} href={item.href}>{item.label}</Link>)}</nav><div className="header-actions"><Link className="button button-primary header-quote" href="/request-a-quote">Get a Quote</Link><button ref={menuButtonRef} className="menu-button" type="button" aria-expanded={drawer === "menu"} aria-controls="site-menu-drawer" onClick={(event) => toggleDrawer("menu", event.currentTarget)}><MenuIcon /><span>Menu</span></button></div></header><ProductsMegaDrawer open={drawer === "products"} onClose={closeDrawer} dialogRef={productsDialogRef} /><SiteMenuDrawer open={drawer === "menu"} onClose={closeDrawer} dialogRef={menuDialogRef} closeButtonRef={menuCloseButtonRef} /></>;
}
