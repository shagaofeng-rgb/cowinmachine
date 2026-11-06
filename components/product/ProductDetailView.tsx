import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Info, ShieldCheck } from "@phosphor-icons/react/ssr";
import { InteriorBreadcrumbs } from "@/components/interior/Interior";
import { BreadcrumbJsonLd, ProductJsonLd } from "@/components/product/ProductJsonLd";
import { ProductDetailTabs } from "@/components/product/ProductDetailTabs";
import { ProductGallery } from "@/components/product/ProductGallery";
import { TechnicalReviewCard } from "@/components/product/TechnicalReviewCard";
import { publishedSpecifications, quickSpecifications } from "@/lib/catalog-presentation";
import { productQuoteHref } from "@/lib/inquiry-context";
import { isCanonicalProductRoute } from "@/lib/product-canonical";
import { getProductDetailProfile } from "@/lib/product-detail-profiles";
import { getGalleryPhotos, isZoomablePhoto } from "@/lib/product-gallery";
import { productPath, productSections, type ProductSectionSlug } from "@/lib/product-sections";
import { getCategory, getProduct, products } from "@/lib/products";
import { siteConfig } from "@/lib/site";
import type { Product, ProductDetailProfile } from "@/types/product";

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="cw-detail-block">
      <h3>{title}</h3>
      <ul className="cw-check-list">{items.map((item) => <li key={item}><Check size={16} aria-hidden="true" /><span>{item}</span></li>)}</ul>
    </section>
  );
}

function getRelatedProducts(product: Product, profile: ProductDetailProfile) {
  const preferred = profile.relatedProductSlugs
    .map((route) => { const [category, slug] = route.split("/"); return getProduct(category, slug); })
    .filter((item): item is Product => item !== undefined && isCanonicalProductRoute(item));
  const fallbacks = products.filter((item) => item.category === product.category && item.slug !== product.slug && isCanonicalProductRoute(item));
  return [...preferred, ...fallbacks]
    .filter((item, index, entries) => item.id !== product.id && entries.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, 4);
}

function SectionContent({ product, profile, section, quoteHref }: {
  product: Product;
  profile: ProductDetailProfile;
  section: ProductSectionSlug;
  quoteHref: string;
}) {
  if (section === "overview") return <>
    <p className="cw-detail-lead">{profile.content.overview}</p>
    <div className="cw-panel-columns">
      <ListBlock title="Key benefits" items={profile.content.benefits} />
      <section className="cw-detail-block"><h3>How it works</h3><p>{profile.content.workingPrinciple}</p></section>
    </div>
  </>;

  if (section === "applications") return <div className="cw-panel-columns">
    <ListBlock title="Typical applications" items={profile.content.applications} />
    <ListBlock title="Selection guide" items={profile.content.selectionGuide} />
  </div>;

  if (section === "specifications") {
    const specifications = publishedSpecifications(profile);
    return <>
      {specifications.length ? (
        <div className="cw-spec-table" role="region" aria-label="Catalog specifications" tabIndex={0}>
          <table><thead><tr><th scope="col">Parameter</th><th scope="col">Catalog value</th></tr></thead>
            <tbody>{specifications.map(({ label, value }) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody>
          </table>
        </div>
      ) : <p className="cw-detail-lead">Verified model-specific values are not published for this record.</p>}
      <p className="cw-spec-note">Final values depend on the reviewed model and project configuration.</p>
      <Link className="cw-link" href={`${quoteHref}&request=verified-specifications`}>Request verified specifications <ArrowRight size={16} aria-hidden="true" /></Link>
    </>;
  }

  if (section === "configuration") return <div className="cw-panel-columns">
    <ListBlock title="Standard configuration" items={profile.standardConfiguration} />
    <ListBlock title="Optional configuration" items={profile.optionalConfiguration} />
  </div>;

  if (section === "maintenance") return <ListBlock title="Operating review" items={profile.content.maintenanceAndSafety} />;

  if (section === "faq") return (
    <div className="cw-faq">
      {profile.content.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}
    </div>
  );

  const related = getRelatedProducts(product, profile);
  return related.length ? (
    <ul className="cw-related-equipment">
      {related.map((item) => (
        <li key={item.id}><Link href={productPath(item)}>
          {item.heroImage && <span className="cw-related-thumb"><Image src={item.heroImage} alt="" fill sizes="80px" /></span>}
          <strong>{item.name}</strong><ArrowRight size={17} aria-hidden="true" />
        </Link></li>
      ))}
    </ul>
  ) : <p className="cw-detail-lead">Related equipment will be confirmed during the application review.</p>;
}

export function ProductDetailView({ product }: { product: Product }) {
  const category = getCategory(product.category);
  if (!category) return null;
  const profile = getProductDetailProfile(product);
  const quoteHref = productQuoteHref(product, profile.model);
  const quickSpecs = quickSpecifications(product.category, profile, 3);
  const photos = getGalleryPhotos(product).map((photo) => ({ ...photo, zoomable: isZoomablePhoto(photo) }));
  const needsReview = profile.publicationState === "configuration-review";
  const crumbs = [
    { label: "Products", href: "/products" },
    { label: category.name, href: `/products/${category.slug}` },
  ];

  return (
    <div className="cw-interior">
      <BreadcrumbJsonLd items={[
        { name: "Home", url: `${siteConfig.siteUrl}/` },
        ...crumbs.map(({ label, href }) => ({ name: label, url: `${siteConfig.siteUrl}${href}` })),
        { name: product.name },
      ]} />
      <ProductJsonLd product={product} profile={profile} />

      <section className="cw-detail-summary">
        <div className="cw-wrap">
          <InteriorBreadcrumbs items={[...crumbs, { label: profile.model ?? "Equipment details" }]} />
          <div className="cw-detail-grid">
            <div className="cw-detail-identity cw-title">
              <p className="cw-kicker">{category.name}</p>
              <h1>{product.name}</h1>
              {profile.model && <p className="cw-model-line">Model <strong>{profile.model}</strong></p>}
              <p>{product.shortDescription}</p>
            </div>
            <ProductGallery key={product.id} photos={photos} productName={product.name} family={product.category} />
            <div className="cw-detail-decision">
              {quickSpecs.length > 0 && (
                <dl className="cw-detail-facts">
                  {quickSpecs.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
                </dl>
              )}
              {needsReview ? (
                <div className="cw-review-note"><Info size={21} aria-hidden="true" /><div><strong>Configuration review required</strong><p>{profile.reviewReason ?? "Confirm the model and operating conditions with our team."}</p></div></div>
              ) : (
                <p className="cw-model-status"><ShieldCheck size={18} aria-hidden="true" />{quickSpecs.length ? "Catalog data. Final configuration subject to review." : "Model identified. Specifications available on request."}</p>
              )}
              <div className="cw-detail-actions">
                <Link className="cw-btn cw-btn-primary" href={quoteHref}>{needsReview ? "Request configuration review" : "Request a quote"} <ArrowRight size={18} aria-hidden="true" /></Link>
                <Link className="cw-btn cw-btn-outline" href="/contact">Contact an engineer</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProductDetailTabs key={product.id} productName={product.name}
        panels={productSections.map(({ slug }) => ({ slug, content: <SectionContent product={product} profile={profile} section={slug} quoteHref={quoteHref} /> }))}
        sidebar={<TechnicalReviewCard quoteHref={quoteHref} model={profile.model} />}
      />
    </div>
  );
}
