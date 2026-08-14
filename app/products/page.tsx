import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProductPagination } from "@/components/product/ProductPagination";
import { getCurrentPage, getPageCount, paginateItems } from "@/lib/pagination";
import { PageHero } from "@/components/PageHero";
import { productCategories, products } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

type ProductsPageProps = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const page = getCurrentPage((await searchParams).page, getPageCount(products.length));
  const path = page === 1 ? "/products" : `/products?page=${page}`;
  const suffix = page === 1 ? "" : ` - Page ${page}`;
  return pageMetadata(`Industrial Equipment Catalog${suffix}`, "Browse COWIN MACHINE equipment categories for compressed air, power, drilling, lighting and material separation requirements.", path);
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const page = getCurrentPage((await searchParams).page, getPageCount(products.length));
  const visibleProducts = paginateItems(products, page);

  return <>
    <PageHero
      eyebrow="Products"
      title="Industrial Equipment Catalog"
      description="Explore six equipment categories for compressed air, power generation, drilling, lighting and material separation projects. Submit your application requirements for a tailored recommendation."
    />
    <section className="section"><div className="content-wrap"><div className="category-grid">{productCategories.map((category) => { const displayProduct = products.find((product) => product.category === category.slug && product.heroImage); return <article className="card category-card" key={category.slug}>{displayProduct?.heroImage ? <Image className="card-image" src={displayProduct.heroImage} alt={`${category.name} equipment product view`} width={720} height={540} sizes="(max-width: 800px) 92vw, (max-width: 1100px) 45vw, 30vw" /> : <div className="placeholder-image">Approved category image pending.</div>}<h2>{category.name}</h2><p>{category.summary}</p><Link className="button button-outline" href={`/products/${category.slug}`}>Explore Category</Link></article>; })}</div></div></section>
    <section className="section section-alt"><div className="content-wrap"><div className="catalog-section-heading"><div><h2>Equipment Catalog</h2><p>Page {page} of {getPageCount(products.length)}. Each page shows up to 12 equipment entries.</p></div></div><div className="catalog-grid">{visibleProducts.map((product) => <article className="card" key={product.id}>{product.heroImage ? <Image className="card-image" src={product.heroImage} alt={product.gallery[0]?.alt ?? `${product.name} product view`} width={720} height={540} sizes="(max-width: 560px) 92vw, (max-width: 800px) 45vw, (max-width: 1100px) 30vw, 22vw" /> : <div className="placeholder-image">Approved product image pending.</div>}<h3>{product.name}</h3><p>{product.shortDescription}</p><Link className="button button-outline" href={`/products/${product.category}/${product.slug}`}>View Equipment</Link></article>)}</div><ProductPagination basePath="/products" currentPage={page} totalPages={getPageCount(products.length)} /></div></section>
  </>;
}
