import Image from "next/image";
import Link from "next/link";
import { ClipboardText, Clock, Mountains, Paperclip, Plug, Ruler } from "@phosphor-icons/react/ssr";
import { HomeTechnicalSelector } from "@/components/sections/HomeTechnicalSelector";
import { homeProductFamilies } from "@/lib/home-product-families";
import { productCategories, products } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";
import { siteConfig, whatsappHref } from "@/lib/site";

export const metadata = pageMetadata(
  "Industrial Equipment Solutions",
  "Explore COWIN MACHINE equipment categories and begin a project-based technical review for mining, construction, remote power and material processing applications.",
);

const representativeProducts = productCategories
  .map((category) => products.find((product) => product.category === category.slug))
  .filter((product): product is NonNullable<typeof product> => Boolean(product));

const featuredProducts = representativeProducts.slice(0, 4);

const rfqChecklist = [
  { label: "Application details", icon: ClipboardText },
  { label: "Working conditions", icon: Mountains },
  { label: "Power source availability", icon: Plug },
  { label: "Required capacity / specs", icon: Ruler },
  { label: "Preferred configuration", icon: Clock },
  { label: "Any other requirements", icon: Paperclip },
];

export default function HomePage() {
  return <>
    <section className="home-selection-hero">
      <Image className="home-selection-hero-image" src="/images/generated/home-technical-selection-hero.png" alt="Unbranded drilling rig operating at a quarry worksite" fill priority sizes="100vw" />
      <div className="home-selection-hero-inner content-wrap">
        <div className="home-selection-hero-copy">
          <p className="eyebrow">Technical selection desk</p>
          <h1>Start with the conditions. Find the right equipment.</h1>
          <p>Tell COWIN MACHINE where and how the equipment will be used. We will use the information you provide to begin a focused configuration discussion.</p>
          <HomeTechnicalSelector />
        </div>
      </div>
    </section>

    <section className="home-family-index" aria-label="Product categories">
      <div className="content-wrap home-family-index-grid">
        {homeProductFamilies.map((family) => {
          return <Link className="home-family-index-item" href={family.href} key={family.href}>
            <Image src={family.image} alt={family.alt} width={160} height={120} sizes="(max-width: 560px) 42vw, (max-width: 1100px) 25vw, 160px" />
            <span className="home-family-index-name">{family.title}</span>
            <span className="home-family-index-arrow" aria-hidden="true">→</span>
          </Link>;
        })}
      </div>
    </section>

    <section className="section home-review-intro">
      <div className="content-wrap home-review-grid">
        <div>
          <p className="eyebrow">Technical selection, simplified</p>
          <h2>From application to a more useful equipment review.</h2>
          <p>Every project has different access, power, material and operating conditions. Start with the jobsite context, then review the suitable equipment category and configuration questions.</p>
          <ul className="home-check-list">
            <li>Application-led equipment routing</li>
            <li>Configuration questions before quotation</li>
            <li>Technical information kept ready for review</li>
          </ul>
          <Link className="text-link home-text-link" href="/request-a-quote">Share your project requirements →</Link>
        </div>
        <aside className="home-review-panel" aria-label="Technical review principles">
          <p className="eyebrow">What we focus on</p>
          <h2>Information that moves the conversation forward.</h2>
          <p>Provide the operating context, practical options and required details. Where specifications need confirmation, they stay subject to application review.</p>
          <ul>
            <li>Relevant project inputs</li>
            <li>Clear technical questions</li>
            <li>Direct communication</li>
          </ul>
        </aside>
      </div>
    </section>

    <section className="home-rfq-strip">
      <div className="content-wrap home-rfq-strip-grid">
        <div><p className="eyebrow">Speed up your review</p><h2>What to send with your RFQ</h2><p>The more jobsite context you share, the more focused the next discussion can be.</p></div>
        <ol>{rfqChecklist.map(({ icon: Icon, label }) => <li key={label}><Icon aria-hidden="true" size={26} weight="regular" /><span>{label}</span></li>)}</ol>
      </div>
    </section>

    <section className="section home-featured-equipment">
      <div className="content-wrap">
        <div className="home-section-heading"><div><p className="eyebrow">Featured equipment</p><h2>Explore equipment for demanding work environments.</h2></div><Link className="text-link" href="/products">View all equipment →</Link></div>
        <div className="home-featured-grid">
          {featuredProducts.map((product) => <article className="home-featured-card" key={product.id}>
            {product.heroImage && <Image src={product.heroImage} alt={product.gallery[0]?.alt ?? `${product.name} product view`} width={720} height={540} sizes="(max-width: 700px) 92vw, (max-width: 1050px) 45vw, 24vw" />}
            <div><p className="eyebrow">{productCategories.find((category) => category.slug === product.category)?.name}</p><h3>{product.name}</h3><p>{product.shortDescription}</p><Link href={`/products/${product.category}/${product.slug}`}>View equipment <span aria-hidden="true">→</span></Link></div>
          </article>)}
        </div>
      </div>
    </section>

    <section className="section section-alt home-news-callout">
      <div className="content-wrap home-news-callout-grid">
        <div><p className="eyebrow">News &amp; Blog</p><h2>Industry context for equipment selection.</h2><p>Read original, source-reviewed material as it is cleared for publication. Product configuration remains subject to application review.</p></div>
        <Link className="button button-outline" href="/news">Visit News &amp; Blog <span aria-hidden="true">→</span></Link>
      </div>
    </section>

    <section className="home-final-cta">
      <div className="content-wrap home-final-cta-grid"><div><h2>Let&apos;s review your equipment requirement.</h2><p>Send the application, operating conditions and required quantity to {siteConfig.brandName}.</p></div><div className="home-final-cta-actions"><Link className="button button-primary" href="/request-a-quote">Request a Quote <span aria-hidden="true">→</span></Link><a className="button home-final-secondary" href={whatsappHref}>WhatsApp Us</a></div></div>
    </section>
  </>;
}
