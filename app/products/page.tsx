import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { ProductCatalogCard } from "@/components/product/ProductCatalogCard";
import { getPageCount, paginateItems, resolvePage } from "@/lib/pagination";
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
  if (resolution.shouldRedirect) permanentRedirect(resolution.page === 1 ? "/products" : `/products?page=${resolution.page}`);

  const page = resolution.page;
  const visibleProducts = paginateItems(canonicalProducts, page);
  const heroProduct = canonicalProducts.find((product) => product.category === "compressed-air-equipment" && product.heroImage) ?? canonicalProducts.find((product) => product.heroImage);

  return <main className="product-catalog-page">
    <section className="product-catalog-hero">
      {heroProduct?.heroImage && <Image className="product-catalog-hero-image" src={heroProduct.heroImage} alt="Industrial equipment from the COWIN MACHINE catalog" fill priority sizes="100vw" />}
      <div className="content-wrap product-catalog-hero-content">
        <p className="eyebrow">COWIN MACHINE / EQUIPMENT CATALOG</p>
        <h1>Industrial equipment for demanding project conditions.</h1>
        <p>Compare published equipment records across compressed air, power, drilling, lighting and material separation. Our team confirms the final configuration against your site conditions.</p>
        <div className="product-catalog-hero-actions">
          <Link className="button button-primary" href="#catalog">Browse equipment</Link>
          <Link className="button button-outline product-catalog-hero-secondary" href="/request-a-quote">Discuss a project</Link>
        </div>
      </div>
    </section>

    <section className="product-directory-section">
      <div className="content-wrap">
        <div className="product-directory-heading"><p className="eyebrow">Browse by equipment family</p><p>{canonicalProducts.length} published equipment records</p></div>
        <nav className="product-directory" aria-label="Product categories">
          <Link href="/products" aria-current="page"><span>All equipment</span><strong>{canonicalProducts.length}</strong></Link>
          {productCategories.map((category) => {
            const count = canonicalProducts.filter((product) => product.category === category.slug).length;
            return <Link key={category.slug} href={`/products/${category.slug}`}><span>{category.name}</span><strong>{count}</strong></Link>;
          })}
        </nav>
      </div>
    </section>

    <section className="section product-catalog-section" id="catalog"><div className="content-wrap">
      <div className="product-catalog-heading">
        <div><p className="eyebrow">Published records</p><h2>Equipment catalog</h2><p>Page {page} of {pageCount}. Each record contains the published model reference and the next step for technical review.</p></div>
        <p className="product-catalog-page-status">Showing {visibleProducts.length} of {canonicalProducts.length}</p>
      </div>
      <div className="product-catalog-grid">{visibleProducts.map((product) => <ProductCatalogCard key={product.id} product={product} showCategory />)}</div>
      <Pagination basePath="/products" currentPage={page} totalPages={pageCount} ariaLabel="Product catalog pagination" />
    </div></section>
  </main>;
}
