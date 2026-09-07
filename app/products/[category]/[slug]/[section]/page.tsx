import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { getProductCanonicalRedirect, isCanonicalProductRoute } from "@/lib/product-canonical";
import { getProductDetailProfile } from "@/lib/product-detail-profiles";
import { getProductSection, isProductSectionSlug, nestedProductSections, productPath, productSectionDescription } from "@/lib/product-sections";
import { getCategory, getProduct, products } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ category: string; slug: string; section: string }> };

export function generateStaticParams() {
  return products.filter(isCanonicalProductRoute).flatMap((product) => nestedProductSections.map((section) => ({ category: product.category, slug: product.slug, section: section.slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, slug, section } = await params;
  const product = getProduct(category, slug);
  if (!product || !isProductSectionSlug(section) || section === "overview") return {};
  const canonicalRedirect = getProductCanonicalRedirect(category, slug);
  if (canonicalRedirect) {
    return { ...pageMetadata(product.name, product.shortDescription, `${canonicalRedirect}/${section}`), robots: { index: false, follow: true } };
  }
  const profile = getProductDetailProfile(product);
  const sectionInfo = getProductSection(section);
  const metadata = pageMetadata(`${sectionInfo.label} | ${product.name}`, productSectionDescription(product, profile, section), productPath(product, section));
  return profile.publicationState === "configuration-review" ? { ...metadata, robots: { index: false, follow: true } } : metadata;
}

export default async function ProductSectionPage({ params }: PageProps) {
  const { category, slug, section } = await params;
  if (category === "category") permanentRedirect("/products");
  if (!isProductSectionSlug(section)) notFound();
  const canonicalRedirect = getProductCanonicalRedirect(category, slug);
  if (canonicalRedirect) permanentRedirect(`${canonicalRedirect}/${section}`);
  const product = getProduct(category, slug);
  if (!product || !getCategory(category)) notFound();
  if (section === "overview") permanentRedirect(productPath(product));
  return <ProductDetailView product={product} section={section} />;
}
