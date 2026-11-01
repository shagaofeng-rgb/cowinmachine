import { notFound, permanentRedirect } from "next/navigation";
import { getProductCanonicalRedirect } from "@/lib/product-canonical";
import { isProductSectionSlug, productSectionHash } from "@/lib/product-sections";
import { getCategory, getProduct } from "@/lib/products";

type PageProps = { params: Promise<{ category: string; slug: string; section: string }> };

export default async function LegacyProductSectionPage({ params }: PageProps) {
  const { category, slug, section } = await params;
  if (!isProductSectionSlug(section) || !getCategory(category)) notFound();

  const canonicalProduct = getProductCanonicalRedirect(category, slug);
  if (!canonicalProduct && !getProduct(category, slug)) notFound();

  const destination = canonicalProduct ?? `/products/${category}/${slug}`;
  permanentRedirect(`${destination}${productSectionHash(section)}`);
}
