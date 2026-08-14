import Link from "next/link";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { PageHero } from "@/components/PageHero";
import { productCategories, products } from "@/lib/products";
import { whatsappHref } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Mobile Lighting & Site Monitoring Equipment", "Independent mobile lighting and site monitoring configuration information, pending product and media verification.");

const reviewAreas = ["Technical review", "Specification approval", "Media rights review", "Quotation coordination"];

export default function HomePage() {
  return <>
    <PageHero eyebrow="Mobile equipment" title="Independent Lighting & Site Monitoring Product Information" description="A review-led product area for buyers who need to discuss site conditions, power availability and deployment requirements." />
    <section className="section section-alt"><div className="content-wrap"><div className="grid">{reviewAreas.map((item) => <div className="card" key={item}><strong>{item}</strong><p>REVIEW REQUIRED: publish verified company and product information only.</p></div>)}</div></div></section>
    <section className="section"><div className="content-wrap"><p className="eyebrow">Product categories</p><h2>Lighting & Site Monitoring Equipment</h2><div className="grid">{productCategories.map((category) => <article className="card" key={category.slug}><div className="placeholder-image">REVIEW REQUIRED: authorized product image.</div><h3>{category.name}</h3><p>{category.summary}</p><Link className="button button-outline" href={`/products/${category.slug}`}>Explore the Category</Link></article>)}</div></div></section>
    <section className="section section-dark"><div className="content-wrap"><p className="eyebrow">Configuration review</p><h2>Start With Your Site Requirements</h2><p>Share the deployment conditions, available power and equipment objective. No suitability or performance claim is made until the supplied information is verified.</p><Link className="button button-primary" href="/request-a-quote">Start a Review</Link></div></section>
    <section className="section section-alt"><div className="content-wrap"><p className="eyebrow">Review entries</p><h2>Lighting & Monitoring Configuration Entries</h2><div className="grid">{products.map((product) => <article className="card" key={product.id}><div className="placeholder-image">REVIEW REQUIRED: authorized product image.</div><h3>{product.name}</h3><p>{product.shortDescription}</p><ul className="spec-list">{product.keySpecifications.map((spec) => <li key={spec.label}><strong>{spec.label}:</strong> {spec.value}</li>)}</ul><Link className="button button-outline" href={`/products/${product.category}/${product.slug}`}>Review Requirements</Link></article>)}</div></div></section>
    <section className="section"><div className="content-wrap"><p className="eyebrow">Inquiry</p><h2>Tell Us About Your Site Requirements.</h2><InquiryForm compact /></div></section>
    <section className="section section-dark"><div className="content-wrap"><h2>Ready to Start a Lighting or Monitoring Review?</h2><p>Share the location, operating conditions and project constraints for a focused discussion.</p><div className="cta-row"><Link className="button button-primary" href="/request-a-quote">Request a Quote</Link><a className="button button-outline" href={whatsappHref}>WhatsApp Us</a></div></div></section>
  </>;
}
