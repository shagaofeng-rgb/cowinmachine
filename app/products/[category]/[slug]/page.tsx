import type { Metadata } from "next";
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
  return product ? pageMetadata(product.name, product.shortDescription, `/products/${product.category}/${product.slug}`) : {};
}
export default async function ProductPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category: categorySlug, slug } = await params;
  const product = getProduct(categorySlug, slug);
  const category = getCategory(categorySlug);
  if (!product || !category) notFound();
  const related = products.filter((item) => item.slug !== product.slug).slice(0, 3);
  return <><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }, { label: category.name, href: `/products/${category.slug}` }, { label: product.name }]} />
    <section className="section"><div className="content-wrap quote-layout"><article><div className="placeholder-image">REVIEW REQUIRED: authorized product image.</div><p className="eyebrow">{product.status}</p><h1>{product.name}</h1><p>{product.shortDescription}</p><h2>Overview</h2><p>{product.description}</p><h2>Information Required for Review</h2><ul className="spec-list">{product.keySpecifications.map((spec) => <li key={spec.label}><strong>{spec.label}:</strong> {spec.value}</li>)}</ul><h2>Applications</h2><ul>{product.applications.map((application) => <li key={application}>{application}</li>)}</ul><h2>Technical Documentation</h2><div className="card"><p>REVIEW REQUIRED: approved specifications, new-brand documentation and image authorization.</p></div></article><aside className="quote-card"><h2>Request a Review</h2><p>Share your material, process conditions and required quantity for a focused discussion.</p><div className="cta-row"><Link className="button button-primary" href={`/request-a-quote?product=${product.slug}`}>Request a Quote</Link><a className="button button-outline" href={whatsappHref}>WhatsApp Us</a></div></aside></div></section>
    <section className="section section-alt"><div className="content-wrap"><h2>Related Review Entries</h2><div className="grid">{related.map((item) => <article className="card" key={item.id}><h3>{item.name}</h3><p>{item.shortDescription}</p><Link className="button button-outline" href={`/products/${item.category}/${item.slug}`}>Review Requirements</Link></article>)}</div></div></section>
    <section className="section"><div className="content-wrap"><h2>Discuss Your Process Conditions</h2><InquiryForm productModel={product.name} /></div></section>
  </>;
}
