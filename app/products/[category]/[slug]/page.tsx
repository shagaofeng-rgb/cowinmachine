import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { getProductCanonicalRedirect, isCanonicalProductRoute } from "@/lib/product-canonical";
import { getProductDetailProfile } from "@/lib/product-detail-profiles";
import { productPath } from "@/lib/product-sections";
import { getCategory, getProduct, products } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";
import type { Product } from "@/types/product";

type PageProps = { params: Promise<{ category: string; slug: string }> };

const canonicalProducts = products.filter(isCanonicalProductRoute);

function productDescription(product: Product, profile: ReturnType<typeof getProductDetailProfile>) {
  if (profile.publicationState !== "full-technical-content") {
    return "This product record requires a configuration review before model-specific technical information is published.";
  }

  const applications = profile.content.applications.slice(0, 2).join(" and ");
  const specifications = profile.specifications.slice(0, 2).map((item) => `${item.label}: ${item.value}`).join("; ");
  return [
    `${product.name}${profile.model && !product.name.toLowerCase().includes(profile.model.toLowerCase()) ? ` (${profile.model})` : ""} for ${applications || "reviewed industrial applications"}.`,
    specifications ? `Verified configuration fields include ${specifications}.` : "",
    "Final configuration remains subject to application review.",
  ].filter(Boolean).join(" ");
}

export function generateStaticParams() {
  return canonicalProducts.map((product) => ({ category: product.category, slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const product = getProduct(category, slug);
  if (!product) return {};

  const canonicalRedirect = getProductCanonicalRedirect(category, slug);
  if (canonicalRedirect) {
    return { ...pageMetadata(product.name, product.shortDescription, canonicalRedirect), robots: { index: false, follow: true } };
  }

  const profile = getProductDetailProfile(product);
  const modelSuffix = profile.model && !product.name.toLowerCase().includes(profile.model.toLowerCase()) ? ` (${profile.model})` : "";
  const title = profile.publicationState === "full-technical-content" ? `${product.name}${modelSuffix}` : `${product.name} | Request Configuration Review`;
  const metadata = pageMetadata(title, productDescription(product, profile), productPath(product));
  return profile.publicationState === "configuration-review" ? { ...metadata, robots: { index: false, follow: true } } : metadata;
}

export default async function ProductPage({ params }: PageProps) {
  const { category, slug } = await params;
  if (category === "category") permanentRedirect("/products");

  const canonicalRedirect = getProductCanonicalRedirect(category, slug);
  if (canonicalRedirect) permanentRedirect(canonicalRedirect);

  const product = getProduct(category, slug);
  if (!product || !getCategory(category)) notFound();
  return <ProductDetailView product={product} section="overview" />;
}
