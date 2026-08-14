import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { productCategories, products } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Industrial Equipment Catalog", "Browse COWIN MACHINE equipment categories for compressed air, power, drilling, lighting and material separation requirements.", "/products");

export default function ProductsPage() {
  return <>
    <PageHero
      eyebrow="Products"
      title="Industrial Equipment Catalog"
      description="Explore six equipment categories for compressed air, power generation, drilling, lighting and material separation projects. Submit your application requirements for a tailored recommendation."
    />
    <section className="section"><div className="content-wrap"><div className="grid">{productCategories.map((category) => <article className="card" key={category.slug}><div className="placeholder-image">TODO: Replace with an authorized product image.</div><h2>{category.name}</h2><p>{category.summary}</p><Link className="button button-outline" href={`/products/${category.slug}`}>Explore Category</Link></article>)}</div></div></section>
    <section className="section section-alt"><div className="content-wrap"><h2>Equipment Catalog</h2><div className="grid">{products.map((product) => <article className="card" key={product.id}><h3>{product.name}</h3><p>{product.shortDescription}</p><Link className="button button-outline" href={`/products/${product.category}/${product.slug}`}>View Equipment</Link></article>)}</div></div></section>
  </>;
}
