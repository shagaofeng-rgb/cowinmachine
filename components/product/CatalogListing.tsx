import type { Metadata } from "next";
import { EquipmentIcon } from "@/components/interior/EquipmentIcon";
import { InteriorCallout, InteriorIntro } from "@/components/interior/Interior";
import { CatalogCollection } from "@/components/product/CatalogCollection";
import { CatalogDirectory } from "@/components/product/CatalogDirectory";
import { catalogHref, getFamilyPresentation, type getCatalogListing } from "@/lib/catalog-presentation";
import { pageMetadata } from "@/lib/seo";

type Listing = ReturnType<typeof getCatalogListing>;
const catalogTitle = "Industrial Equipment Catalog";

export function catalogListingMetadata({ category, basePath, catalog }: Listing): Metadata {
  const { resolution, search } = catalog;
  const page = resolution.valid ? resolution.page : 1;
  const suffix = page === 1 ? "" : ` - Page ${page}`;
  const title = category ? category.name + (search ? " Search" : "") : search ? "Equipment Search" : catalogTitle;
  const metadata = pageMetadata(
    title + suffix,
    category?.summary ?? "Browse COWIN MACHINE equipment categories for compressed air, power, drilling, lighting and material separation requirements.",
    catalogHref(basePath, page, search),
  );
  return resolution.valid && !search ? metadata : { ...metadata, robots: { index: false, follow: resolution.valid } };
}

export function CatalogListing({ listing }: { listing: Listing }) {
  const { category, basePath, catalog } = listing;
  const family = category ? getFamilyPresentation(category.slug) : undefined;

  return (
    <div className="cw-interior">
      {category && family ? (
        <InteriorIntro
          items={[{ label: "Products", href: "/products" }, { label: category.name }]}
          label="Equipment family"
          title={category.name}
          description={family.summary}
          action={<span className="cw-family-mark"><EquipmentIcon family={category.slug} size={65} /></span>}
        />
      ) : (
        <InteriorIntro
          items={[{ label: "Products" }]}
          label="COWIN MACHINE"
          title={catalogTitle}
          description="Find air compressors, generators, drilling equipment, light towers and magnetic separators for your project."
        />
      )}
      <CatalogDirectory active={category?.slug} />
      <CatalogCollection catalog={catalog} basePath={basePath} title={category ? `Available ${category.name.toLowerCase()}` : "All equipment"} showCategory={!category} />
      {category && family
        ? <InteriorCallout title={`Selecting ${category.name.toLowerCase()}`} description={family.selection} href={`/request-a-quote?category=${category.slug}`} action="Request selection support" />
        : <InteriorCallout title="Need help selecting equipment?" description="Share your application, required output and site conditions with our team." href="/request-a-quote" action="Discuss your project" />}
    </div>
  );
}
