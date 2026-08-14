import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { productCategories, products } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Industrial Equipment Solutions", "Explore independently structured industrial equipment product entries pending technical and media verification.", "/products");

export default function ProductsPage() {
  return <>
    <PageHero
      eyebrow="Products"
      title="Industrial Equipment Solutions"
      description="Five independently structured equipment categories. Every entry remains review-gated until verified evidence and media authorization are available."
    />
    <section className="section"><div className="content-wrap"><div className="grid">{productCategories.map((category) => <article className="card" key={category.slug}><div className="placeholder-image">REVIEW REQUIRED: authorized product image.</div><h2>{category.name}</h2><p>{category.summary}</p><Link className="button button-outline" href={`/products/${category.slug}`}>Explore Category</Link></article>)}</div></div></section>
    <section className="section section-alt"><div className="content-wrap"><h2>Configuration Review Entries</h2><div className="grid">{products.map((product) => <article className="card" key={product.id}><h3>{product.name}</h3><p>{product.shortDescription}</p><Link className="button button-outline" href={`/products/${product.category}/${product.slug}`}>Review Requirements</Link></article>)}</div></div></section>
  </>;
}
