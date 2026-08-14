import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { getCategory, getProduct, products } from "@/lib/products";
import { whatsappHref } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() { return products.map((product) => ({ category: product.category, slug: product.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const product = getProduct(category, slug);
  return product ? pageMetadata(`${product.name} | ${product.id.toUpperCase()}`, product.shortDescription, `/products/${product.category}/${product.slug}`) : {};
}
export default async function ProductPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category: categorySlug, slug } = await params;
  const product = getProduct(categorySlug, slug);
  const category = getCategory(categorySlug);
  if (!product || !category) notFound();
  const related = products.filter((item) => item.category === product.category && item.slug !== product.slug).slice(0, 3);
  return <><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }, { label: category.name, href: `/products/${category.slug}` }, { label: product.name }]} />
    <section className="section"><div className="content-wrap quote-layout"><article>{product.heroImage ? <Image className="product-detail-image" src={product.heroImage} alt={`${product.name} product view`} width={1200} height={900} priority sizes="(max-width: 800px) 92vw, 70vw" /> : <div className="placeholder-image">Product image available with your quotation request.</div>}<p className="eyebrow">{product.status}</p><h1>{product.name}</h1><p className="catalog-reference">Catalog reference: {product.id.toUpperCase()}</p><p>{product.shortDescription}</p><h2>Overview</h2><p>{product.description}</p><h2>Key Specifications</h2><ul className="spec-list">{product.keySpecifications.map((spec) => <li key={spec.label}><strong>{spec.label}:</strong> {spec.value}</li>)}</ul><h2>Applications</h2><ul>{product.applications.map((application) => <li key={application}>{application}</li>)}</ul><h2>Technical Specifications</h2><div className="specification-table-wrap"><table><tbody>{product.technicalSpecifications.map((spec) => <tr key={spec.label}><th scope="row">{spec.label}</th><td>{spec.value}</td></tr>)}</tbody></table></div></article><aside className="quote-card"><h2>Request a Quote</h2><p>Share your application, duty requirements and required quantity for a tailored recommendation.</p><div className="cta-row"><Link className="button button-primary" href={`/request-a-quote?product=${product.slug}`}>Request a Quote</Link><a className="button button-outline" href={whatsappHref}>WhatsApp Us</a></div></aside></div></section>
    <section className="section section-alt"><div className="content-wrap"><h2>Related Equipment</h2><div className="grid">{related.map((item) => <article className="card" key={item.id}>{item.heroImage ? <Image className="card-image" src={item.heroImage} alt={`${item.name} product view`} width={720} height={540} sizes="(max-width: 800px) 92vw, 25vw" /> : null}<h3>{item.name}</h3><p>{item.shortDescription}</p><Link className="button button-outline" href={`/products/${item.category}/${item.slug}`}>View Details</Link></article>)}</div></div></section>
    <section className="section"><div className="content-wrap"><h2>Discuss Your Process Conditions</h2><InquiryForm productModel={product.name} /></div></section>
  </>;
}
