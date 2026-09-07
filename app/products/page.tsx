import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ProductPagination } from "@/components/product/ProductPagination";
import { getPageCount, paginateItems, resolvePage } from "@/lib/pagination";
import { PageHero } from "@/components/PageHero";
import { isCanonicalProductRoute } from "@/lib/product-canonical";
import { productCategories, products } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

type ProductsPageProps = { searchParams: Promise<{ page?: string }> };

const canonicalProducts = products.filter(isCanonicalProductRoute);

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const resolution = resolvePage((await searchParams).page, getPageCount(canonicalProducts.length));
  const page = resolution.valid ? resolution.page : 1;
  const path = page === 1 ? "/products" : `/products?page=${page}`;
  const suffix = page === 1 ? "" : ` - Page ${page}`;
  const metadata = pageMetadata(
    `Industrial Equipment Catalog${suffix}`,
    "Browse COWIN MACHINE equipment categories for compressed air, power, drilling, lighting and material separation requirements.",
    path,
  );
  return resolution.valid ? metadata : { ...metadata, robots: { index: false, follow: false } };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const pageCount = getPageCount(canonicalProducts.length);
  const resolution = resolvePage((await searchParams).page, pageCount);
  if (!resolution.valid) notFound();
  if (resolution.shouldRedirect) {
    permanentRedirect(resolution.page === 1 ? "/products" : `/products?page=${resolution.page}`);
  }

  const page = resolution.page;
  const visibleProducts = paginateItems(canonicalProducts, page);

  return <>
    <PageHero
      eyebrow="Products"
      title="Industrial Equipment Catalog"
      description="Explore six equipment categories for compressed air, power generation, drilling, lighting and material separation projects. Submit your application requirements for a tailored recommendation."
    />
    <section className="section"><div className="content-wrap"><div className="category-grid">{productCategories.map((category) => { const displayProduct = canonicalProducts.find((product) => product.category === category.slug && product.heroImage); return <article className="card category-card" key={category.slug}>{displayProduct?.heroImage ? <Image className="card-image" src={displayProduct.heroImage} alt={`${category.name} equipment product view`} width={720} height={540} sizes="(max-width: 800px) 92vw, (max-width: 1100px) 45vw, 30vw" /> : <div className="placeholder-image">Approved category image pending.</div>}<h2>{category.name}</h2><p>{category.summary}</p><Link className="button button-outline" href={`/products/${category.slug}`}>Explore Category</Link></article>; })}</div></div></section>
    <section className="section section-alt"><div className="content-wrap"><div className="catalog-section-heading"><div><h2>Equipment Catalog</h2><p>Page {page} of {pageCount}. Each page shows up to 12 canonical equipment entries.</p></div></div><div className="catalog-grid">{visibleProducts.map((product) => <article className="card" key={product.id}>{product.heroImage ? <Image className="card-image" src={product.heroImage} alt={product.gallery[0]?.alt ?? `${product.name} product view`} width={720} height={540} sizes="(max-width: 560px) 92vw, (max-width: 800px) 45vw, (max-width: 1100px) 30vw, 22vw" /> : <div className="placeholder-image">Approved product image pending.</div>}<h3>{product.name}</h3><p>{product.shortDescription}</p><Link className="button button-outline" href={`/products/${product.category}/${product.slug}`}>View Equipment</Link></article>)}</div><ProductPagination basePath="/products" currentPage={page} totalPages={pageCount} /></div></section>
  </>;
}
