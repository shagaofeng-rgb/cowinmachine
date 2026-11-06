import { CatalogListing, catalogListingMetadata } from "@/components/product/CatalogListing";
import { getCatalogListing } from "@/lib/catalog-presentation";

const listing = getCatalogListing();
export const metadata = catalogListingMetadata(listing);

export default function ProductsPage() {
  return <CatalogListing listing={listing} />;
}
