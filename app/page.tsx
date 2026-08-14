import Link from "next/link";
import type { Metadata } from "next";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { PageHero } from "@/components/PageHero";
import { productCategories, products } from "@/lib/products";
import { whatsappHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Magnetic Separation Systems",
  description: "Independent magnetic separation configuration information, pending product and media verification.",
};

const reviewAreas = ["Technical review", "Specification approval", "Media rights review", "Quotation coordination"];

export default function HomePage() {
  return <>
    <PageHero eyebrow="Magnetic separation" title="Independent Magnetic Separation Product Information" description="A review-led product area for buyers who need to discuss material, process conditions and separation requirements." />
    <section className="section section-alt"><div className="content-wrap"><div className="grid">{reviewAreas.map((item) => <div className="card" key={item}><strong>{item}</strong><p>REVIEW REQUIRED: publish verified company and product information only.</p></div>)}</div></div></section>
    <section className="section"><div className="content-wrap"><p className="eyebrow">Product category</p><h2>Magnetic Separators</h2><div className="grid">{productCategories.map((category) => <article className="card" key={category.slug}><div className="placeholder-image">REVIEW REQUIRED: authorized product image.</div><h3>{category.name}</h3><p>{category.summary}</p><Link className="button button-outline" href={`/products/${category.slug}`}>Explore the Category</Link></article>)}</div></div></section>
    <section className="section section-dark"><div className="content-wrap"><p className="eyebrow">Configuration review</p><h2>Start With Your Material and Process Conditions</h2><p>Share your operating information. No suitability or performance claim is made until the supplied information is verified.</p><Link className="button button-primary" href="/request-a-quote">Start a Review</Link></div></section>
    <section className="section section-alt"><div className="content-wrap"><p className="eyebrow">Review entries</p><h2>Magnetic Separation Configuration Entries</h2><div className="grid">{products.map((product) => <article className="card" key={product.id}><div className="placeholder-image">REVIEW REQUIRED: authorized product image.</div><h3>{product.name}</h3><p>{product.shortDescription}</p><ul className="spec-list">{product.keySpecifications.map((spec) => <li key={spec.label}><strong>{spec.label}:</strong> {spec.value}</li>)}</ul><Link className="button button-outline" href={`/products/${product.category}/${product.slug}`}>Review Requirements</Link></article>)}</div></div></section>
    <section className="section"><div className="content-wrap"><p className="eyebrow">Inquiry</p><h2>Tell Us About Your Process Conditions.</h2><InquiryForm compact /></div></section>
    <section className="section section-dark"><div className="content-wrap"><h2>Ready to Start a Magnetic Separation Review?</h2><p>Share the material, operating conditions and process constraints for a focused discussion.</p><div className="cta-row"><Link className="button button-primary" href="/request-a-quote">Request a Quote</Link><a className="button button-outline" href={whatsappHref}>WhatsApp Us</a></div></div></section>
  </>;
}
