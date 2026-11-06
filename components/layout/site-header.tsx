"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretDown, List, SquaresFour } from "@phosphor-icons/react/ssr";
import { useEffect, useRef, useState } from "react";
import { ProductsMegaDrawer } from "@/components/layout/products-mega-drawer";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { SiteMenuDrawer } from "@/components/layout/site-menu-drawer";
import { desktopNavigation } from "@/lib/navigation";

type Drawer = "products" | "menu" | null;
const focusable = "a[href], button:not([disabled]), summary, [tabindex]:not([tabindex='-1'])";

export function SiteHeader() {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const productsButton = useRef<HTMLButtonElement>(null);
  const productsGroup = useRef<HTMLDivElement>(null);
  const productsPanel = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuPanel = useRef<HTMLElement>(null);
  const menuClose = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | null>(null);

  function cancelProductsClose() {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }

  function scheduleProductsClose() {
    cancelProductsClose();
    closeTimer.current = window.setTimeout(() => {
      if (!productsPanel.current?.contains(document.activeElement)) setDrawer((value) => value === "products" ? null : value);
      closeTimer.current = null;
    }, 150);
  }

  function closeMenu(returnFocus = true) {
    setDrawer(null);
    if (returnFocus) requestAnimationFrame(() => menuButton.current?.focus({ preventScroll: true }));
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawer(null));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    const syncScroll = () => setIsScrolled(window.scrollY > 4);
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnResize = () => setDrawer(null);
    syncScroll();
    window.addEventListener("scroll", syncScroll, { passive: true });
    desktop.addEventListener("change", closeOnResize);
    return () => {
      window.removeEventListener("scroll", syncScroll);
      desktop.removeEventListener("change", closeOnResize);
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!drawer) return;
    const isMenu = drawer === "menu";
    const previousOverflow = document.body.style.overflow;
    const focusFrame = isMenu ? requestAnimationFrame(() => menuClose.current?.focus()) : null;
    if (isMenu) document.body.style.overflow = "hidden";
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        const focusIsInside = productsGroup.current?.contains(document.activeElement);
        cancelProductsClose();
        setDrawer(null);
        if (isMenu || focusIsInside) requestAnimationFrame(() => (isMenu ? menuButton.current : productsButton.current)?.focus({ preventScroll: true }));
      }
      if (!isMenu || event.key !== "Tab") return;
      const items = [...(menuPanel.current?.querySelectorAll<HTMLElement>(focusable) ?? [])].filter((item) => item.getClientRects().length > 0);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    function outsidePointer(event: PointerEvent) {
      if (!isMenu && event.target instanceof Node && !productsGroup.current?.contains(event.target)) setDrawer(null);
    }
    document.addEventListener("keydown", keydown);
    document.addEventListener("pointerdown", outsidePointer);
    return () => {
      if (focusFrame !== null) cancelAnimationFrame(focusFrame);
      if (isMenu) document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("pointerdown", outsidePointer);
    };
  }, [drawer]);

  function isActive(href: string) {
    return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  }

  const renderLink = (item: (typeof desktopNavigation)[number]) =>
    <Link key={item.href} className={isActive(item.href) ? "nav-link nav-link-active" : "nav-link"}
      aria-current={pathname === item.href ? "page" : undefined} href={item.href}>{item.label}</Link>;

  return <>
    <header className={`site-header${isScrolled ? " scrolled" : ""}`}>
      <SiteLogo />
      <nav className="desktop-nav" aria-label="Primary navigation">
        {desktopNavigation.slice(0, 1).map(renderLink)}
        <div ref={productsGroup} className="products-nav-group"
          onPointerEnter={(event) => {
            if (event.pointerType !== "mouse") return;
            cancelProductsClose();
            setDrawer("products");
          }}
          onPointerLeave={(event) => { if (event.pointerType === "mouse") scheduleProductsClose(); }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              cancelProductsClose();
              setDrawer((value) => value === "products" ? null : value);
            }
          }}>
          <button ref={productsButton} className={`products-nav-button${drawer === "products" || isActive("/products") ? " nav-link-active" : ""}`}
            type="button" aria-expanded={drawer === "products"} aria-controls={drawer === "products" ? "products-mega-drawer" : undefined}
            onClick={(event) => {
              cancelProductsClose();
              setDrawer((value) => event.detail === 0 && value === "products" ? null : "products");
            }}>
            <SquaresFour size={18} aria-hidden="true" /><span>Products</span>
            <CaretDown size={16} aria-hidden="true" className={`products-chevron${drawer === "products" ? " products-chevron-open" : ""}`} />
          </button>
          <ProductsMegaDrawer open={drawer === "products"} onClose={() => setDrawer(null)} dialogRef={productsPanel} />
        </div>
        {desktopNavigation.slice(1).map(renderLink)}
      </nav>
      <div className="header-actions">
        <Link className="button button-primary header-quote" href="/request-a-quote">Get a Quote</Link>
        <button ref={menuButton} className="menu-button" type="button" aria-expanded={drawer === "menu"}
          aria-controls={drawer === "menu" ? "site-menu-drawer" : undefined} onClick={() => setDrawer((value) => value === "menu" ? null : "menu")}>
          <List size={19} aria-hidden="true" /><span>Menu</span>
        </button>
      </div>
    </header>
    <SiteMenuDrawer open={drawer === "menu"} onClose={closeMenu} dialogRef={menuPanel} closeButtonRef={menuClose} />
  </>;
}
