import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { BreadcrumbJsonLd, ProductJsonLd } from "@/components/product/ProductJsonLd";
import { TechnicalReviewCard } from "@/components/product/TechnicalReviewCard";
import { getProductCanonicalRedirect, isCanonicalProductRoute, productPath } from "@/lib/product-canonical";
import { getProductDetailProfile } from "@/lib/product-detail-profiles";
import { getCategory, getProduct, products } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";
import type { Product } from "@/types/product";

type PageProps = { params: Promise<{ category: string; slug: string }> };

const canonicalProducts = products.filter(isCanonicalProductRoute);

function productDescription(product: Product, profile: ReturnType<typeof getProductDetailProfile>) {
  if (profile.publicationState !== "full-technical-content") {
    return "This product record requires a configuration review before model-specific technical information is published.";
  }

  const applications = profile.content.applications.slice(0, 2).join(" and ");
  const specifications = profile.specifications.slice(0, 2).map((item) => `${item.label}: ${item.value}`).join("; ");
  return [
    `${product.name}${profile.model && !product.name.toLowerCase().includes(profile.model.toLowerCase()) ? ` (${profile.model})` : ""} for ${applications || "reviewed industrial applications"}.`,
    specifications ? `Verified configuration fields include ${specifications}.` : "",
    "Final configuration remains subject to application review.",
  ].filter(Boolean).join(" ");
}

export function generateStaticParams() {
  return canonicalProducts.map((product) => ({ category: product.category, slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const product = getProduct(category, slug);
  if (!product) return {};

  const canonicalRedirect = getProductCanonicalRedirect(category, slug);
  if (canonicalRedirect) {
    return {
      ...pageMetadata(product.name, product.shortDescription, canonicalRedirect),
      robots: { index: false, follow: true },
    };
  }

  const profile = getProductDetailProfile(product);
  const modelSuffix = profile.model && !product.name.toLowerCase().includes(profile.model.toLowerCase())
    ? ` (${profile.model})`
    : "";
  const title = profile.publicationState === "full-technical-content"
    ? `${product.name}${modelSuffix}`
    : `${product.name} | Request Configuration Review`;
  const metadata = pageMetadata(title, productDescription(product, profile), productPath(product.category, product.slug));

  if (profile.publicationState === "configuration-review") {
    return { ...metadata, robots: { index: false, follow: true } };
  }

  return metadata;
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  return <section className="product-content-section"><h2>{title}</h2><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
}

export default async function ProductPage({ params }: PageProps) {
  const { category: categorySlug, slug } = await params;
  if (categorySlug === "category") permanentRedirect("/products");

  const canonicalRedirect = getProductCanonicalRedirect(categorySlug, slug);
  if (canonicalRedirect) permanentRedirect(canonicalRedirect);

  const product = getProduct(categorySlug, slug);
  const category = getCategory(categorySlug);
  if (!product || !category) notFound();

  const profile = getProductDetailProfile(product);
  const path = productPath(product.category, product.slug);
  const related = profile.relatedProductSlugs
    .map((route) => { const [relatedCategory, relatedSlug] = route.split("/"); return getProduct(relatedCategory, relatedSlug); })
    .filter((item): item is Product => item !== undefined && isCanonicalProductRoute(item));
  const safeRelated = related.length
    ? related
    : canonicalProducts.filter((item) => item.category === product.category && item.slug !== product.slug).slice(0, 3);
  const crumbs = [{ label: "Home", href: "/" }, { label: "Products", href: "/products" }, { label: category.name, href: `/products/${category.slug}` }, { label: product.name }];

  return <>
    <Breadcrumbs items={crumbs} />
    <BreadcrumbJsonLd items={crumbs.map((item) => ({ name: item.label, url: item.href ? `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://cowinmachine.com"}${item.href}` : undefined }))} />
    <ProductJsonLd product={product} profile={profile} />
    <section className="section product-detail-section"><div className="content-wrap quote-layout">
      <article>
        <div className="product-showcase">
          <div className="product-gallery" aria-label={`${product.name} image gallery`}>
            {product.heroImage ? <Image className="product-detail-image" src={product.heroImage} alt={product.gallery[0]?.alt ?? `${product.name} product view`} width={1200} height={900} priority sizes="(max-width: 800px) 92vw, (max-width: 1180px) 58vw, 720px" /> : <div className="placeholder-image">Product image pending review.</div>}
            <div className="product-thumbnail-row">{product.gallery.slice(0, 3).map((image) => <span className="product-thumbnail" key={image.src}><Image src={image.src} alt="" width={88} height={66} sizes="88px" /></span>)}</div>
          </div>
          <div className="product-identity"><p className="eyebrow">{profile.publicationState === "full-technical-content" ? "Identified model" : "Configuration review required"}</p><h1>{product.name}</h1><p className="catalog-reference">Model reference: {profile.model ?? "Awaiting confirmation"}</p><p>{product.shortDescription}</p><div className="product-tags"><span>{category.name}</span><span>{profile.publicationState === "full-technical-content" ? "Technical content available" : "Request Configuration Review"}</span></div></div>
        </div>
        {profile.publicationState === "configuration-review" && <div className="review-notice" role="status"><strong>Request Configuration Review.</strong> {profile.reviewReason} Configuration subject to application review.</div>}
        <section className="product-content-section"><h2>Overview</h2><p>{profile.content.overview}</p></section>
        {profile.publicationState === "full-technical-content" && <section className="product-content-section"><h2>Verified Selection Snapshot for {profile.model ?? product.name}</h2><p>{productDescription(product, profile)}</p></section>}
        <ListSection title="Key Benefits" items={profile.content.benefits} />
        <section className="product-content-section"><h2>How It Works</h2><p>{profile.content.workingPrinciple}</p></section>
        <ListSection title="Typical Applications" items={profile.content.applications} />
        <ListSection title="Selection Guide" items={profile.content.selectionGuide} />
        <section className="product-content-section"><h2>Technical Specifications</h2>{profile.specifications.length ? <div className="specification-table-wrap"><table><tbody>{profile.specifications.map((spec) => <tr key={spec.label}><th scope="row">{spec.label}</th><td>{spec.value}</td></tr>)}</tbody></table></div> : <p className="configuration-note">Configuration subject to application review. Request verified specifications for this record.</p>}</section>
        <ListSection title="Standard Configuration" items={profile.standardConfiguration} />
        <ListSection title="Optional Configuration" items={profile.optionalConfiguration} />
        <ListSection title="Operation, Maintenance and Safety" items={profile.content.maintenanceAndSafety} />
      </article>
      <TechnicalReviewCard productName={product.name} productModel={profile.model} productUrl={path} />
    </div></section>
    <section className="section section-alt"><div className="content-wrap"><h2>Related Products / Compatible Equipment</h2><div className="grid product-related-grid">{safeRelated.map((item) => <article className="card" key={item.id}>{item.heroImage && <Image className="card-image" src={item.heroImage} alt={item.gallery[0]?.alt ?? `${item.name} product view`} width={720} height={540} sizes="(max-width: 800px) 92vw, 30vw" />}<h3>{item.name}</h3><p>{item.shortDescription}</p><Link className="button button-outline" href={productPath(item.category, item.slug)}>View Details</Link></article>)}</div></div></section>
    <section className="section"><div className="content-wrap product-link-grid"><div><h2>News &amp; Blog</h2><p>Read source-reviewed industry context and practical equipment-selection guidance, then request model-specific documentation for procurement decisions.</p><Link className="button button-outline" href="/news">Explore News &amp; Blog</Link></div><div><h2>Need a Configuration Review?</h2><p>Share the operating conditions, available utilities and project constraints before final equipment selection.</p><Link className="button button-outline" href="/request-a-quote">Talk to Our Team</Link></div></div></section>
    <section className="section section-alt"><div className="content-wrap"><h2>Product FAQ</h2><div className="faq-list">{profile.content.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></div></section>
    <section className="section"><div className="content-wrap"><h2>Technical Inquiry</h2><p>Product name, model reference and page URL are included with this inquiry.</p><InquiryForm productModel={profile.model ? `${product.name} (${profile.model})` : product.name} productUrl={`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://cowinmachine.com"}${path}`} defaults={{ category: product.category }} /></div></section>
  </>;
}
