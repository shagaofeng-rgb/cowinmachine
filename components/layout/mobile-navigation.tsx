import Link from "next/link";
import { productNavigation, siteMenuNavigation } from "@/lib/navigation";

export function MobileNavigation({ onNavigate }: { onNavigate: () => void }) {
  return <nav className="mobile-drawer-navigation" aria-label="Mobile navigation">
    <details className="mobile-products-accordion">
      <summary>Products <span aria-hidden="true">+</span></summary>
      <ul>{productNavigation.map((product) => <li key={product.href}><Link href={product.href} onClick={onNavigate}>{product.label}</Link></li>)}</ul>
    </details>
    <ul className="mobile-drawer-links">{siteMenuNavigation.map((item) => <li key={item.href}><Link href={item.href} onClick={onNavigate}>{item.label}</Link></li>)}</ul>
  </nav>;
}
