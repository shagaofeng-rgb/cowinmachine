import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { InteriorCallout, InteriorIntro } from "@/components/interior/Interior";
import { CatalogCollection } from "@/components/product/CatalogCollection";
import { CatalogDirectory } from "@/components/product/CatalogDirectory";
import { catalogHref, catalogProducts, resolveCatalog, type CatalogParams } from "@/lib/catalog-presentation";
import { pageMetadata } from "@/lib/seo";

const basePath = "/products";
type ProductsPageProps = { searchParams: Promise<CatalogParams> };

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const { resolution, search } = resolveCatalog(catalogProducts, await searchParams);
  const page = resolution.valid ? resolution.page : 1;
  const suffix = page === 1 ? "" : ` - Page ${page}`;
  const metadata = pageMetadata(
    `${search ? "Equipment Search" : "Industrial Equipment Catalog"}${suffix}`,
    "Browse COWIN MACHINE equipment categories for compressed air, power, drilling, lighting and material separation requirements.",
    catalogHref(basePath, page, search),
  );
  return resolution.valid && !search ? metadata : { ...metadata, robots: { index: false, follow: resolution.valid } };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const catalog = resolveCatalog(catalogProducts, await searchParams);
  if (!catalog.resolution.valid) notFound();
  if (catalog.resolution.shouldRedirect) permanentRedirect(catalogHref(basePath, catalog.resolution.page, catalog.search));

  return (
    <div className="cw-interior">
      <InteriorIntro
        items={[{ label: "Products" }]}
        label="COWIN MACHINE"
        title="Industrial Equipment Catalog"
        description="Find air compressors, generators, drilling equipment, light towers and magnetic separators for your project."
      />
      <CatalogDirectory />
      <CatalogCollection catalog={catalog} basePath={basePath} title="All equipment" showCategory />
      <InteriorCallout title="Need help selecting equipment?" description="Share your application, required output and site conditions with our team." href="/request-a-quote" action="Discuss your project" />
    </div>
  );
}
