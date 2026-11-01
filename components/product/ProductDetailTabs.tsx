"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { isProductSectionSlug, productSectionHash, productSections, type ProductSectionSlug } from "@/lib/product-sections";

type Panel = { slug: ProductSectionSlug; content: ReactNode };

function sectionFromHash(): ProductSectionSlug {
  const slug = window.location.hash.slice(1);
  return isProductSectionSlug(slug) ? slug : "overview";
}

export function ProductDetailTabs({ panels, sidebar, productName }: { panels: Panel[]; sidebar: ReactNode; productName: string }) {
  const [active, setActive] = useState<ProductSectionSlug>("overview");

  useEffect(() => {
    const syncFromHash = () => setActive(sectionFromHash());
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("popstate", syncFromHash);
    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("popstate", syncFromHash);
    };
  }, []);

  function selectSection(slug: ProductSectionSlug) {
    setActive(slug);
    const hash = productSectionHash(slug);
    window.history.pushState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
  }

  const activeIndex = productSections.findIndex((section) => section.slug === active);
  const previous = productSections[activeIndex - 1];
  const next = productSections[activeIndex + 1];

  return <>
    <div className="product-section-nav-shell"><div className="content-wrap">
      <nav className="product-section-nav" role="tablist" aria-label={`${productName} detail sections`}>
        {productSections.map((section) => <button
          key={section.slug}
          id={`product-tab-${section.slug}`}
          type="button"
          role="tab"
          aria-controls={`product-panel-${section.slug}`}
          aria-selected={active === section.slug}
          className={active === section.slug ? "product-section-link product-section-link-active" : "product-section-link"}
          onClick={() => selectSection(section.slug)}
        >{section.label}</button>)}
      </nav>
    </div></div>

    <section className="section product-detail-section"><div className="content-wrap quote-layout product-section-layout">
      <div className="product-section-panel">
        {productSections.map((section, index) => <article
          key={section.slug}
          id={`product-panel-${section.slug}`}
          role="tabpanel"
          aria-labelledby={`product-tab-${section.slug}`}
          hidden={active !== section.slug}
        >
          <p className="eyebrow">Section {index + 1} of {productSections.length}</p>
          <h2>{section.heading}</h2>
          {panels.find((panel) => panel.slug === section.slug)?.content}
        </article>)}
        <nav className="product-section-stepper" aria-label="Product detail section navigation">
          {previous ? <button type="button" onClick={() => selectSection(previous.slug)}><span>Previous</span><strong>{previous.label}</strong></button> : <span />}
          {next ? <button type="button" onClick={() => selectSection(next.slug)}><span>Next</span><strong>{next.label}</strong></button> : <Link href="/request-a-quote"><span>Next step</span><strong>Request a Quote</strong></Link>}
        </nav>
      </div>
      {sidebar}
    </div></section>
  </>;
}
