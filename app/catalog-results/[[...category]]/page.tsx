import { notFound, permanentRedirect } from "next/navigation";
import { CatalogListing, catalogListingMetadata } from "@/components/product/CatalogListing";
import { catalogHref, getCatalogListing, type CatalogParams } from "@/lib/catalog-presentation";
import { getCategory } from "@/lib/products";

type ResultsPageProps = {
  params: Promise<{ category?: string[] }>;
  searchParams: Promise<CatalogParams>;
};

async function readListing({ params, searchParams }: ResultsPageProps) {
  const { category = [] } = await params;
  const family = category.length === 1 ? getCategory(category[0]) : undefined;
  if (category.length && !family) notFound();
  return getCatalogListing(family, await searchParams);
}

export async function generateMetadata(props: ResultsPageProps) {
  return catalogListingMetadata(await readListing(props));
}

export default async function CatalogResultsPage(props: ResultsPageProps) {
  const listing = await readListing(props);
  const { basePath, catalog: { resolution, search } } = listing;
  if (!resolution.valid) notFound();
  if (resolution.shouldRedirect) permanentRedirect(catalogHref(basePath, resolution.page, search));
  return <CatalogListing listing={listing} />;
}
