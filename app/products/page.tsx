import Image from "next/image";
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
    <section className="section"><div className="content-wrap"><div className="grid">{productCategories.map((category) => { const displayProduct = products.find((product) => product.category === category.slug && product.heroImage); return <article className="card" key={category.slug}>{displayProduct?.heroImage ? <Image className="card-image" src={displayProduct.heroImage} alt={`${category.name} equipment product view`} width={720} height={540} sizes="(max-width: 800px) 92vw, 25vw" /> : <div className="placeholder-image">Approved category image pending.</div>}<h2>{category.name}</h2><p>{category.summary}</p><Link className="button button-outline" href={`/products/${category.slug}`}>Explore Category</Link></article>; })}</div></div></section>
    <section className="section section-alt"><div className="content-wrap"><h2>Equipment Catalog</h2><div className="grid">{products.map((product) => <article className="card" key={product.id}>{product.heroImage ? <Image className="card-image" src={product.heroImage} alt={product.gallery[0]?.alt ?? `${product.name} product view`} width={720} height={540} sizes="(max-width: 800px) 92vw, 25vw" /> : <div className="placeholder-image">Approved product image pending.</div>}<h3>{product.name}</h3><p>{product.shortDescription}</p><Link className="button button-outline" href={`/products/${product.category}/${product.slug}`}>View Equipment</Link></article>)}</div></div></section>
  </>;
}
