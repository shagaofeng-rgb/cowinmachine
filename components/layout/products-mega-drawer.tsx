import Link from "next/link";
import { productNavigation } from "@/lib/navigation";

export function ProductsMegaDrawer({ open, onClose, dialogRef }: { open: boolean; onClose: () => void; dialogRef: React.RefObject<HTMLDivElement | null> }) {
  if (!open) return null;

  return <div ref={dialogRef} id="products-mega-drawer" className="products-mega-drawer">
      <div className="products-mega-panel">
        <section className="products-mega-intro" aria-label="Product center introduction">
          <p className="products-mega-kicker">Product Center</p>
          <h2>Explore Industrial Equipment</h2>
          <p>Browse equipment categories and send your application requirements for product selection support.</p>
          <Link className="products-mega-all-link" href="/products" onClick={onClose}>View All Products <span aria-hidden="true">→</span></Link>
        </section>
        <section className="products-mega-categories" aria-label="Product categories">
          <ul>{productNavigation.map((product) => <li key={product.href}><Link href={product.href} className="products-mega-card" onClick={onClose}>
            <span className="products-mega-number">{product.number}</span><h3>{product.label}</h3><p>{product.description}</p><span className="products-mega-arrow" aria-hidden="true">Explore category →</span>
          </Link></li>)}</ul>
        </section>
        <div className="products-mega-help">Need help choosing equipment for your application? <Link href="/request-a-quote" onClick={onClose}>Talk to an Engineer <span aria-hidden="true">→</span></Link></div>
      </div>
    </div>;
}
