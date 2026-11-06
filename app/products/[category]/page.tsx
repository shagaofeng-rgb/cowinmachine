import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { EquipmentIcon } from "@/components/interior/EquipmentIcon";
import { InteriorCallout, InteriorIntro } from "@/components/interior/Interior";
import { CatalogCollection } from "@/components/product/CatalogCollection";
import { CatalogDirectory } from "@/components/product/CatalogDirectory";
import { catalogHref, catalogProducts, getFamilyPresentation, resolveCatalog, type CatalogParams } from "@/lib/catalog-presentation";
import { getCategory, productCategories } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<CatalogParams>;
};

export function generateStaticParams() {
  return productCategories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const category = getCategory((await params).category);
  if (!category) return {};
  const entries = catalogProducts.filter((product) => product.category === category.slug);
  const { resolution, search } = resolveCatalog(entries, await searchParams);
  const page = resolution.valid ? resolution.page : 1;
  const suffix = page === 1 ? "" : ` - Page ${page}`;
  const path = catalogHref(`/products/${category.slug}`, page, search);
  const metadata = pageMetadata(`${category.name}${search ? " Search" : ""}${suffix}`, category.summary, path);
  return resolution.valid && !search ? metadata : { ...metadata, robots: { index: false, follow: resolution.valid } };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const category = getCategory((await params).category);
  if (!category) notFound();
  const entries = catalogProducts.filter((product) => product.category === category.slug);
  const catalog = resolveCatalog(entries, await searchParams);
  const basePath = `/products/${category.slug}`;
  if (!catalog.resolution.valid) notFound();
  if (catalog.resolution.shouldRedirect) permanentRedirect(catalogHref(basePath, catalog.resolution.page, catalog.search));
  const family = getFamilyPresentation(category.slug);

  return (
    <div className="cw-interior">
      <InteriorIntro
        items={[{ label: "Products", href: "/products" }, { label: category.name }]}
        label="Equipment family"
        title={category.name}
        description={family.summary}
        action={<span className="cw-family-mark"><EquipmentIcon family={category.slug} size={65} /></span>}
      />
      <CatalogDirectory active={category.slug} />
      <CatalogCollection catalog={catalog} basePath={basePath} title={`Available ${category.name.toLowerCase()}`} />
      <InteriorCallout title={`Selecting ${category.name.toLowerCase()}`} description={family.selection} href={`/request-a-quote?category=${category.slug}`} action="Request selection support" />
    </div>
  );
}
