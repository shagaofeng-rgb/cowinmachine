import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductPagination } from "@/components/product/ProductPagination";
import { PageHero } from "@/components/PageHero";
import { getCurrentPage, getPageCount, paginateItems } from "@/lib/pagination";
import { getProductDetailProfile } from "@/lib/product-detail-profiles";
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
  const itemCount = products.filter((product) => product.category === category.slug).length;
  const page = getCurrentPage((await searchParams).page, getPageCount(itemCount));
  const path = page === 1 ? `/products/${category.slug}` : `/products/${category.slug}?page=${page}`;
  const suffix = page === 1 ? "" : ` - Page ${page}`;
  return pageMetadata(`${category.name}${suffix}`, category.summary, path);
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) permanentRedirect("/products");

  const entries = products.filter((product) => product.category === category.slug);
  const pageCount = getPageCount(entries.length);
  const page = getCurrentPage((await searchParams).page, pageCount);
  const visibleProducts = paginateItems(entries, page);
  const basePath = `/products/${category.slug}`;

  return <>
    <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }, { label: category.name }]} />
    <PageHero eyebrow="Product Category" title={category.name} description={category.summary} />
    <section className="section"><div className="content-wrap"><div className="catalog-section-heading"><div><h2>{category.name} Catalog</h2><p>Review the published model references and available technical data. Confirm site conditions and final configuration with our team before ordering.</p></div><p className="catalog-page-status">Page {page} of {pageCount}</p></div><div className="catalog-grid">{visibleProducts.map((product) => {
      const profile = getProductDetailProfile(product);
      return <article className="card" key={product.id}>{product.heroImage ? <Image className="card-image" src={product.heroImage} alt={product.gallery[0]?.alt ?? `${product.name} product view`} width={720} height={540} sizes="(max-width: 560px) 92vw, (max-width: 800px) 45vw, (max-width: 1100px) 30vw, 22vw" /> : <div className="placeholder-image">Product image pending review.</div>}<h3>{product.name}</h3><p>{product.shortDescription}</p>{profile.publicationState === "full-technical-content" ? <ul className="spec-list">{product.keySpecifications.map((spec) => <li key={spec.label}>{spec.label}: {spec.value}</li>)}</ul> : <p className="configuration-note">Model-specific technical data is available after configuration review.</p>}<div className="cta-row"><Link className="button button-outline" href={`/products/${product.category}/${product.slug}`}>View Details</Link><Link className="button button-primary" href={`/request-a-quote?product=${product.slug}`}>{profile.publicationState === "full-technical-content" ? "Request a Quote" : "Request Review"}</Link></div></article>;
    })}</div><ProductPagination basePath={basePath} currentPage={page} totalPages={pageCount} /></div></section>
    <section className="section section-alt"><div className="content-wrap"><h2>How to Choose</h2><p>Confirm your material, operating environment, power availability, output requirement and safety constraints with an engineer before selecting a model.</p><Link className="button button-primary" href="/contact">Contact an Engineer</Link></div></section>
  </>;
}
