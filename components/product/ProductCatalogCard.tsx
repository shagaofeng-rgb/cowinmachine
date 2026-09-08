import Image from "next/image";
import Link from "next/link";
import { getProductDetailProfile } from "@/lib/product-detail-profiles";
import { productPath } from "@/lib/product-sections";
import { getCategory } from "@/lib/products";
import type { Product } from "@/types/product";

type ProductCatalogCardProps = {
  product: Product;
  showCategory?: boolean;
};

export function ProductCatalogCard({ product, showCategory = false }: ProductCatalogCardProps) {
  const category = getCategory(product.category);
  const profile = getProductDetailProfile(product);
  const specifications = profile.specifications.slice(0, 2);
  const path = productPath(product);

  return (
    <article className="product-catalog-card">
      <Link className="product-catalog-card-media" href={path} aria-label={`View ${product.name}`}>
        {product.heroImage ? (
          <Image
            src={product.heroImage}
            alt={product.gallery[0]?.alt ?? `${product.name} product view`}
            fill
            sizes="(max-width: 620px) 100vw, (max-width: 1020px) 50vw, 25vw"
          />
        ) : (
          <span className="placeholder-image">Approved product image pending.</span>
        )}
      </Link>
      <div className="product-catalog-card-body">
        <div className="product-catalog-card-meta">
          {showCategory && <span>{category?.name ?? "Equipment"}</span>}
          <span>{profile.model ? `Model ${profile.model}` : "Configuration review"}</span>
        </div>
        <h2><Link href={path}>{product.name}</Link></h2>
        <p>{product.shortDescription}</p>
        {specifications.length ? (
          <dl className="product-catalog-specs">
            {specifications.map((specification) => (
              <div key={specification.label}>
                <dt>{specification.label}</dt>
                <dd>{specification.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="product-catalog-review">Technical details are confirmed during configuration review.</p>
        )}
        <div className="product-catalog-card-actions">
          <Link href={path}>View equipment <span aria-hidden="true">→</span></Link>
          <Link href={`/request-a-quote?product=${encodeURIComponent(product.name)}&productUrl=${encodeURIComponent(path)}`}>Request quote</Link>
        </div>
      </div>
    </article>
  );
}
