import { siteConfig } from "@/lib/site";
import type { Product, ProductDetailProfile } from "@/types/product";

export function ProductJsonLd({ product, profile }: { product: Product; profile: ProductDetailProfile }) {
  if (profile.publicationState !== "full-technical-content") return null;
  const url = `${siteConfig.siteUrl}/products/${product.category}/${product.slug}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    model: profile.model ?? undefined,
    description: product.shortDescription,
    image: product.heroImage ? [`${siteConfig.siteUrl}${product.heroImage}`] : undefined,
    url,
    additionalProperty: profile.specifications.filter((item) => item.value !== "Configuration subject to application review.").map((item) => ({ "@type": "PropertyValue", name: item.label, value: item.value })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url?: string }> }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
