import Link from "next/link";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { siteMenuNavigation } from "@/lib/navigation";
import { siteConfig, whatsappHref } from "@/lib/site";

export function SiteMenuDrawer({ open, onClose, dialogRef, closeButtonRef }: { open: boolean; onClose: () => void; dialogRef: React.RefObject<HTMLElement | null>; closeButtonRef: React.RefObject<HTMLButtonElement | null> }) {
  if (!open) return null;
  return <>
    <button className="navigation-backdrop" aria-label="Close site menu" onClick={onClose} />
    <aside ref={dialogRef} id="site-menu-drawer" className="site-menu-drawer" role="dialog" aria-modal="true" aria-label="Site menu">
      <div className="site-menu-drawer-top"><p>COWIN MACHINE</p><button ref={closeButtonRef} className="close-button" type="button" onClick={onClose} aria-label="Close menu">×</button></div>
      <Link className="button button-primary site-menu-primary-cta" href="/request-a-quote" onClick={onClose}>Get a Quote</Link>
      <div className="desktop-drawer-navigation"><nav aria-label="Site navigation"><ul>{siteMenuNavigation.map((item) => <li key={item.href}><Link href={item.href} onClick={onClose}>{item.label}</Link></li>)}</ul></nav></div>
      <MobileNavigation onNavigate={onClose} />
      <div className="site-menu-drawer-contact"><a href={`mailto:${siteConfig.email}`}>Email: {siteConfig.email}</a><a href={whatsappHref}>WhatsApp: {siteConfig.phone}</a><p>Factory in Quzhou, China</p></div>
    </aside>
  </>;
}
