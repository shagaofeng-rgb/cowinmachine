import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbJsonLd, ProductJsonLd } from "@/components/product/ProductJsonLd";
import { TechnicalReviewCard } from "@/components/product/TechnicalReviewCard";
import { isCanonicalProductRoute } from "@/lib/product-canonical";
import { getProductDetailProfile } from "@/lib/product-detail-profiles";
import { getProductSection, productPath, productSections, type ProductSectionSlug } from "@/lib/product-sections";
import { getCategory, getProduct, products } from "@/lib/products";
import { siteConfig } from "@/lib/site";
import type { Product } from "@/types/product";

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return <section className="product-section-block"><h3>{title}</h3><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
}

function getRelatedProducts(product: Product) {
  const profile = getProductDetailProfile(product);
  const preferred = profile.relatedProductSlugs
    .map((route) => { const [category, slug] = route.split("/"); return getProduct(category, slug); })
    .filter((item): item is Product => item !== undefined && isCanonicalProductRoute(item));
  const fallbacks = products.filter((item) => item.category === product.category && item.slug !== product.slug && isCanonicalProductRoute(item));
  return [...preferred, ...fallbacks]
    .filter((item, index, entries) => entries.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, 4);
}

function SectionContent({ product, section }: { product: Product; section: ProductSectionSlug }) {
  const profile = getProductDetailProfile(product);

  if (section === "overview") return <>
    <p className="product-section-lede">{profile.content.overview}</p>
    <div className="product-section-columns">
      <ListBlock title="Key Benefits" items={profile.content.benefits} />
      <section className="product-section-block"><h3>How It Works</h3><p>{profile.content.workingPrinciple}</p></section>
    </div>
  </>;

  if (section === "applications") return <div className="product-section-columns">
    <ListBlock title="Typical Applications" items={profile.content.applications} />
    <ListBlock title="Selection Guide" items={profile.content.selectionGuide} />
  </div>;

  if (section === "specifications") return profile.specifications.length ? <div className="specification-table-wrap"><table><tbody>{profile.specifications.map((spec) => <tr key={spec.label}><th scope="row">{spec.label}</th><td>{spec.value}</td></tr>)}</tbody></table></div> : <p className="configuration-note">Configuration subject to application review. Request verified specifications for this record.</p>;

  if (section === "configuration") return <div className="product-section-columns">
    <ListBlock title="Standard Configuration" items={profile.standardConfiguration} />
    <ListBlock title="Optional Configuration" items={profile.optionalConfiguration} />
  </div>;

  if (section === "maintenance") return <ListBlock title="Operating Review" items={profile.content.maintenanceAndSafety} />;

  if (section === "faq") return <div className="faq-list">{profile.content.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div>;

  const related = getRelatedProducts(product);
  return related.length ? <div className="product-related-grid">{related.map((item) => <article className="card" key={item.id}>
    {item.heroImage && <Image className="card-image" src={item.heroImage} alt={item.gallery[0]?.alt ?? `${item.name} product view`} width={720} height={540} sizes="(max-width: 560px) 92vw, (max-width: 900px) 45vw, 22vw" />}
    <h3>{item.name}</h3><p>{item.shortDescription}</p><Link className="button button-outline" href={productPath(item)}>View Details</Link>
  </article>)}</div> : <p className="configuration-note">Related equipment will be confirmed during the application review.</p>;
}

export function ProductDetailView({ product, section }: { product: Product; section: ProductSectionSlug }) {
  const category = getCategory(product.category);
  if (!category) return null;
  const profile = getProductDetailProfile(product);
  const activeSection = getProductSection(section);
  const activeIndex = productSections.findIndex((item) => item.slug === section);
  const previousSection = activeIndex > 0 ? productSections[activeIndex - 1] : null;
  const nextSection = activeIndex < productSections.length - 1 ? productSections[activeIndex + 1] : null;
  const basePath = productPath(product);
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: category.name, href: `/products/${category.slug}` },
    ...(section === "overview" ? [{ label: product.name }] : [{ label: product.name, href: basePath }, { label: activeSection.label }]),
  ];

  return <>
    <Breadcrumbs items={crumbs} />
    <BreadcrumbJsonLd items={crumbs.map((item) => ({ name: item.label, url: item.href ? `${siteConfig.siteUrl}${item.href}` : undefined }))} />
    <ProductJsonLd product={product} profile={profile} />

    <section className="section product-summary-section"><div className="content-wrap">
      <div className="product-showcase">
        <div className="product-gallery" aria-label={`${product.name} image gallery`}>
          {product.heroImage ? <Image className="product-detail-image" src={product.heroImage} alt={product.gallery[0]?.alt ?? `${product.name} product view`} width={1200} height={900} priority sizes="(max-width: 1000px) 92vw, (max-width: 1180px) 58vw, 660px" /> : <div className="placeholder-image">Product image pending review.</div>}
          <div className="product-thumbnail-row">{product.gallery.slice(0, 3).map((image) => <span className="product-thumbnail" key={image.src}><Image src={image.src} alt="" width={88} height={66} sizes="88px" /></span>)}</div>
        </div>
        <div className="product-identity"><p className="eyebrow">{profile.publicationState === "full-technical-content" ? "Identified model" : "Configuration review required"}</p><h1>{product.name}</h1><p className="catalog-reference">Model reference: {profile.model ?? "Awaiting confirmation"}</p><p>{product.shortDescription}</p><div className="product-tags"><span>{category.name}</span><span>{profile.publicationState === "full-technical-content" ? "Technical content available" : "Request Configuration Review"}</span></div><div className="cta-row"><Link className="button button-primary" href={`/request-a-quote?product=${encodeURIComponent(product.name)}&productUrl=${encodeURIComponent(basePath)}`}>Request a Quote</Link><Link className="button button-outline" href="/contact">Contact an Engineer</Link></div></div>
      </div>
      {profile.publicationState === "configuration-review" && <div className="review-notice" role="status"><strong>Request Configuration Review.</strong> {profile.reviewReason} Configuration subject to application review.</div>}
    </div></section>

    <div className="product-section-nav-shell"><div className="content-wrap">
      <nav className="product-section-nav" aria-label={`${product.name} detail sections`}>
        {productSections.map((item) => <Link key={item.slug} href={productPath(product, item.slug)} className={item.slug === section ? "product-section-link product-section-link-active" : "product-section-link"} aria-current={item.slug === section ? "page" : undefined}>{item.label}</Link>)}
      </nav>
    </div></div>

    <section className="section product-detail-section"><div className="content-wrap quote-layout product-section-layout">
      <article className="product-section-panel" aria-labelledby="product-section-heading">
        <p className="eyebrow">Section {activeIndex + 1} of {productSections.length}</p>
        <h2 id="product-section-heading">{activeSection.heading}</h2>
        <SectionContent product={product} section={section} />
        <nav className="product-section-stepper" aria-label="Product detail section navigation">
          {previousSection ? <Link href={productPath(product, previousSection.slug)}><span>Previous</span><strong>{previousSection.label}</strong></Link> : <span />}
          {nextSection ? <Link href={productPath(product, nextSection.slug)}><span>Next</span><strong>{nextSection.label}</strong></Link> : <Link href="/request-a-quote"><span>Next step</span><strong>Request a Quote</strong></Link>}
        </nav>
      </article>
      <TechnicalReviewCard productName={product.name} productModel={profile.model} productUrl={basePath} />
    </div></section>
  </>;
}
