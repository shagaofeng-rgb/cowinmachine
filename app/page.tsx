import Image from "next/image";
import Link from "next/link";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { PageHero } from "@/components/PageHero";
import { productCategories, products } from "@/lib/products";
import { whatsappHref } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Industrial Equipment Solutions", "Independent industrial equipment configuration information, pending product and media verification.");

const reviewAreas = ["Technical review", "Specification approval", "Media rights review", "Quotation coordination"];
const featuredCatalogEntries = productCategories.flatMap((category) => products.filter((product) => product.category === category.slug).slice(0, 2));

export default function HomePage() {
  return <>
    <PageHero eyebrow="Industrial equipment" title="Independent Industrial Equipment Product Information" description="A review-led product area for buyers who need to discuss jobsite conditions, power availability and project requirements." image={{ src: "/images/generated/home-remote-jobsite.png", alt: "Remote industrial jobsite at dawn" }} />
    <section className="section section-alt"><div className="content-wrap"><div className="grid">{reviewAreas.map((item) => <div className="card" key={item}><strong>{item}</strong><p>REVIEW REQUIRED: publish verified company and product information only.</p></div>)}</div></div></section>
    <section className="section"><div className="content-wrap"><p className="eyebrow">Product categories</p><h2>Industrial Equipment Categories</h2><div className="category-grid">{productCategories.map((category) => { const displayProduct = products.find((product) => product.category === category.slug && product.heroImage); return <article className="card category-card" key={category.slug}>{displayProduct?.heroImage ? <Image className="card-image" src={displayProduct.heroImage} alt={`${category.name} equipment product view`} width={720} height={540} sizes="(max-width: 800px) 92vw, (max-width: 1100px) 45vw, 30vw" /> : <div className="placeholder-image">Approved category image pending.</div>}<h3>{category.name}</h3><p>{category.summary}</p><Link className="button button-outline" href={`/products/${category.slug}`}>Explore the Category</Link></article>; })}</div></div></section>
    <section className="section section-dark"><div className="content-wrap"><p className="eyebrow">Configuration review</p><h2>Start With Your Project Requirements</h2><p>Share the operating conditions, available power and equipment objective. No suitability or performance claim is made until the supplied information is verified.</p><Link className="button button-primary" href="/request-a-quote">Start a Review</Link></div></section>
    <section className="section section-alt"><div className="content-wrap"><p className="eyebrow">Equipment entries</p><h2>Explore Equipment by Category</h2><div className="catalog-grid">{featuredCatalogEntries.map((product) => <article className="card" key={product.id}>{product.heroImage ? <Image className="card-image" src={product.heroImage} alt={product.gallery[0]?.alt ?? `${product.name} product view`} width={720} height={540} sizes="(max-width: 560px) 92vw, (max-width: 800px) 45vw, (max-width: 1100px) 30vw, 22vw" /> : <div className="placeholder-image">Approved product image pending.</div>}<h3>{product.name}</h3><p>{product.shortDescription}</p><ul className="spec-list">{product.keySpecifications.map((spec) => <li key={spec.label}><strong>{spec.label}:</strong> {spec.value}</li>)}</ul><Link className="button button-outline" href={`/products/${product.category}/${product.slug}`}>View Equipment</Link></article>)}</div><div className="catalog-browse-link"><Link className="button button-outline" href="/products">Browse All Equipment</Link></div></div></section>
    <section className="section"><div className="content-wrap"><p className="eyebrow">Inquiry</p><h2>Tell Us About Your Project Requirements.</h2><InquiryForm compact /></div></section>
    <section className="section section-dark"><div className="content-wrap"><h2>Ready to Start an Equipment Review?</h2><p>Share the location, operating conditions and project constraints for a focused discussion.</p><div className="cta-row"><Link className="button button-primary" href="/request-a-quote">Request a Quote</Link><a className="button button-outline" href={whatsappHref}>WhatsApp Us</a></div></div></section>
  </>;
}
