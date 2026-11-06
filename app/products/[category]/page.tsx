import { notFound } from "next/navigation";
import { CatalogListing, catalogListingMetadata } from "@/components/product/CatalogListing";
import { getCatalogListing } from "@/lib/catalog-presentation";
import { getCategory, productCategories } from "@/lib/products";

type CategoryPageProps = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return productCategories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const category = getCategory((await params).category);
  return category ? catalogListingMetadata(getCatalogListing(category)) : {};
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const category = getCategory((await params).category);
  if (!category) notFound();
  return <CatalogListing listing={getCatalogListing(category)} />;
}
