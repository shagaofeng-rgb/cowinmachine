"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { isProductSectionSlug, productSectionHash, productSections, type ProductSectionSlug } from "@/lib/product-sections";

type Panel = { slug: ProductSectionSlug; content: ReactNode };

function sectionFromHash(): ProductSectionSlug {
  const slug = window.location.hash.slice(1);
  return isProductSectionSlug(slug) ? slug : "overview";
}

export function ProductDetailTabs({ panels, sidebar, productName }: { panels: Panel[]; sidebar: ReactNode; productName: string }) {
  const [active, setActive] = useState<ProductSectionSlug>("overview");
  const rail = useRef<HTMLElement>(null);

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

  useEffect(() => {
    const tabs = rail.current;
    const tab = tabs?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!tabs || !tab) return;

    const railBounds = tabs.getBoundingClientRect();
    const tabBounds = tab.getBoundingClientRect();
    if (tabBounds.left < railBounds.left) tabs.scrollLeft -= railBounds.left - tabBounds.left;
    if (tabBounds.right > railBounds.right) tabs.scrollLeft += tabBounds.right - railBounds.right;
  }, [active]);

  function selectSection(slug: ProductSectionSlug) {
    setActive(slug);
    if (sectionFromHash() !== slug) {
      const hash = productSectionHash(slug);
      window.history.pushState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
    }
  }

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const count = productSections.length;
    const destination = {
      ArrowLeft: (index + count - 1) % count,
      ArrowRight: (index + 1) % count,
      Home: 0,
      End: count - 1,
    }[event.key];
    if (destination === undefined) return;
    event.preventDefault();
    const next = productSections[destination].slug;
    selectSection(next);
    rail.current?.querySelector<HTMLButtonElement>(`#product-tab-${next}`)?.focus({ preventScroll: true });
  }

  return (
    <section className="cw-product-details" aria-label="Product information">
      <div className="cw-tabs-bar">
        <div className="cw-wrap">
          <nav ref={rail} className="cw-tabs" role="tablist" aria-label={`${productName} details`}>
            {productSections.map((section, index) => (
              <button key={section.slug} id={`product-tab-${section.slug}`} type="button" role="tab"
                aria-controls={`product-panel-${section.slug}`} aria-selected={active === section.slug}
                tabIndex={active === section.slug ? 0 : -1}
                onClick={() => selectSection(section.slug)} onKeyDown={(event) => moveFocus(event, index)}
              >{section.label}</button>
            ))}
          </nav>
        </div>
      </div>
      <div className="cw-wrap cw-detail-content">
        <div className="cw-detail-panels">
          {productSections.map((section) => (
            <div key={section.slug} id={`product-panel-${section.slug}`} className="cw-product-panel"
              role="tabpanel" aria-labelledby={`product-tab-${section.slug}`} hidden={active !== section.slug} tabIndex={0}
            >
              <h2>{section.heading}</h2>
              {panels.find((panel) => panel.slug === section.slug)?.content}
            </div>
          ))}
        </div>
        {sidebar}
      </div>
    </section>
  );
}
