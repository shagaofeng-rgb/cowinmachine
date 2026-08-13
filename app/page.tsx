import Link from "next/link";
import type { Metadata } from "next";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { PageHero } from "@/components/PageHero";
import { productCategories, products } from "@/lib/products";

export const metadata: Metadata = { title: "Industrial Equipment Solutions", description: "Explore replaceable industrial equipment solution placeholders for mining, construction, remote power and material processing applications." };

const capabilities = ["Technical Selection Support", "Quality Inspection", "OEM & Customization", "Global Shipping Support"];
export default function HomePage() { return <>
  <PageHero eyebrow="Industrial Equipment Solutions" title="Industrial Equipment for Mining, Construction & Remote Power" description="Reliable air compressors, drilling rigs, solar light towers and magnetic separation equipment for demanding jobsites." />
  <section className="section section-alt"><div className="content-wrap"><div className="grid">{capabilities.map((item) => <div className="card" key={item}><strong>{item}</strong><p>TODO: Replace with verified COWIN MACHINE company information.</p></div>)}</div></div></section>
  <section className="section"><div className="content-wrap"><p className="eyebrow">Product lines</p><h2>Equipment for application-led selection</h2><div className="grid">{productCategories.map((category) => <article className="card" key={category.slug}><div className="placeholder-image">TODO: Replace with authorized product image.</div><h3>{category.name}</h3><p>{category.summary}</p><Link className="button button-outline" href={`/products/${category.slug}`}>View Products</Link></article>)}</div></div></section>
  <section className="section section-dark"><div className="content-wrap"><p className="eyebrow">Equipment finder</p><h2>Find the Right Equipment for Your Project</h2><div className="grid">{productCategories.map((category) => <Link className="card" key={category.slug} href={`/products/${category.slug}?application=project`}><h3>{category.name}</h3><p>Review replaceable options for your application.</p></Link>)}</div></div></section>
  <section className="section section-alt"><div className="content-wrap"><p className="eyebrow">Featured equipment</p><h2>Replaceable equipment placeholders</h2><div className="grid">{products.slice(0, 8).map((product) => <article className="card" key={product.id}><div className="placeholder-image">TODO: Replace with authorized product image.</div><h3>{product.name}</h3><p>{product.shortDescription}</p><ul className="spec-list">{product.keySpecifications.map((spec) => <li key={spec.label}><strong>{spec.label}:</strong> {spec.value}</li>)}</ul><Link className="button button-outline" href={`/products/${product.category}/${product.slug}`}>View Details</Link></article>)}</div></div></section>
  <section className="section"><div className="content-wrap"><p className="eyebrow">Inquiry</p><h2>Tell Us Your Application. We’ll Recommend the Right Model.</h2><InquiryForm compact /></div></section>
  <section className="section section-dark"><div className="content-wrap"><h2>Ready to Start Your Equipment Project?</h2><p>Share the operating conditions and equipment requirements for a tailored discussion.</p><div className="cta-row"><Link className="button button-primary" href="/request-a-quote">Request a Quote</Link><a className="button button-outline" href="https://wa.me/8615665135205">WhatsApp Us</a></div></div></section>
</>; }
