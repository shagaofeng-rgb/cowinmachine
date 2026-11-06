import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/ssr";
import { EquipmentIcon } from "@/components/interior/EquipmentIcon";
import { quickSpecifications } from "@/lib/catalog-presentation";
import { productQuoteHref } from "@/lib/inquiry-context";
import { getProductDetailProfile } from "@/lib/product-detail-profiles";
import { productPath } from "@/lib/product-sections";
import { getCategory } from "@/lib/products";
import type { Product } from "@/types/product";

export function ProductCatalogCard({ product, showCategory = false, eager = false }: { product: Product; showCategory?: boolean; eager?: boolean }) {
  const profile = getProductDetailProfile(product);
  const specifications = quickSpecifications(product.category, profile, 2);
  const path = productPath(product);
  const alt = product.gallery.find((photo) => photo.src === product.heroImage)?.alt ?? `${product.name} product view`;

  return (
    <article className="cw-equipment-card">
      <Link className="cw-equipment-media" href={path} aria-label={`View ${product.name}`}>
        {product.heroImage
          ? <Image src={product.heroImage} alt={alt} fill sizes="(max-width: 540px) 92vw, (max-width: 860px) 45vw, (max-width: 1100px) 30vw, 290px" loading={eager ? "eager" : undefined} fetchPriority={eager ? "high" : undefined} />
          : <span className="cw-no-photo"><EquipmentIcon family={product.category} size={46} /><span>Product photo unavailable</span></span>}
      </Link>
      <div className="cw-equipment-body">
        <p className="cw-card-meta">{showCategory ? getCategory(product.category)?.name : profile.model ? `Model ${profile.model}` : "Model on request"}</p>
        <h3><Link href={path}>{product.name}</Link></h3>
        {specifications.length ? (
          <dl className="cw-card-specs">
            {specifications.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        ) : <p className="cw-card-review">{profile.publicationState === "configuration-review" ? "Configuration review required" : "Specifications on request"}</p>}
        <div className="cw-equipment-actions">
          <Link className="cw-link" href={path} aria-label={`View details for ${product.name}`}>Details <ArrowRight size={16} aria-hidden="true" /></Link>
          <Link className="cw-btn cw-btn-outline cw-btn-small" href={productQuoteHref(product, profile.model)} aria-label={`Get quote for ${product.name}`}>Get quote</Link>
        </div>
      </div>
    </article>
  );
}
