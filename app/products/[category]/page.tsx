import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Pagination } from "@/components/Pagination";
import { PageHero } from "@/components/PageHero";
import { ProductCatalogCard } from "@/components/product/ProductCatalogCard";
import { getPageCount, paginateItems, resolvePage } from "@/lib/pagination";
import { isCanonicalProductRoute } from "@/lib/product-canonical";
import { getCategory, productCategories, products } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
};

export function generateStaticParams() {
  return productCategories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  const itemCount = products.filter((product) => product.category === category.slug && isCanonicalProductRoute(product)).length;
  const resolution = resolvePage((await searchParams).page, getPageCount(itemCount));
  const page = resolution.valid ? resolution.page : 1;
  const path = page === 1 ? `/products/${category.slug}` : `/products/${category.slug}?page=${page}`;
  const suffix = page === 1 ? "" : ` - Page ${page}`;
  const metadata = pageMetadata(`${category.name}${suffix}`, category.summary, path);
  return resolution.valid ? metadata : { ...metadata, robots: { index: false, follow: false } };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) permanentRedirect("/products");

  const entries = products.filter((product) => product.category === category.slug && isCanonicalProductRoute(product));
  const pageCount = getPageCount(entries.length);
  const resolution = resolvePage((await searchParams).page, pageCount);
  const basePath = `/products/${category.slug}`;
  if (!resolution.valid) notFound();
  if (resolution.shouldRedirect) {
    permanentRedirect(resolution.page === 1 ? basePath : `${basePath}?page=${resolution.page}`);
  }

  const page = resolution.page;
  const visibleProducts = paginateItems(entries, page);
  const categoryImage = entries.find((product) => product.heroImage)?.heroImage;

  return <>
    <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }, { label: category.name }]} />
    <PageHero eyebrow="Product Category" title={category.name} description={category.summary} image={categoryImage ? { src: categoryImage, alt: `${category.name} equipment` } : undefined} />
    <section className="product-category-context"><div className="content-wrap">
      <div><p className="eyebrow">Category scope</p><p>Review {entries.length} published equipment records and use the model details to start a configuration conversation.</p></div>
      <ul>{category.subcategories.map((subcategory) => <li key={subcategory}>{subcategory}</li>)}</ul>
      <Link href="/products">All equipment <span aria-hidden="true">→</span></Link>
    </div></section>
    <section className="section product-catalog-section"><div className="content-wrap"><div className="product-catalog-heading"><div><p className="eyebrow">{category.name}</p><h2>Available equipment</h2><p>Published model references and technical content are shown here. Final selection remains subject to application review.</p></div><p className="product-catalog-page-status">Page {page} of {pageCount}</p></div><div className="product-catalog-grid">{visibleProducts.map((product) => <ProductCatalogCard key={product.id} product={product} />)}</div><Pagination basePath={basePath} currentPage={page} totalPages={pageCount} ariaLabel={`${category.name} catalog pagination`} /></div></section>
    <section className="product-category-cta"><div className="content-wrap"><div><p className="eyebrow">Selection support</p><h2>Match the equipment to the job, not just the model.</h2></div><p>Share material, operating environment, power availability, output requirement and safety constraints with an engineer before selecting a final configuration.</p><Link className="button button-primary" href="/contact">Contact an Engineer</Link></div></section>
  </>;
}
