import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CaretRight } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import "@/app/interior.css";

export type InteriorCrumb = { label: string; href?: string };

export function InteriorBreadcrumbs({ items }: { items: InteriorCrumb[] }) {
  return (
    <nav className="cw-crumbs" aria-label="Breadcrumb">
      <ol>
        {[{ label: "Home", href: "/" }, ...items].map((item, index) => (
          <li key={item.label}>
            {index > 0 && <CaretRight size={12} aria-hidden="true" />}
            {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function InteriorIntro({
  items, label, title, description, action,
}: {
  items: InteriorCrumb[];
  label?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="cw-intro">
      <div className="cw-wrap">
        <InteriorBreadcrumbs items={items} />
        <div className="cw-intro-layout">
          <div className="cw-title">
            {label && <p className="cw-kicker">{label}</p>}
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>
          {action}
        </div>
      </div>
    </header>
  );
}

export function InteriorCallout({
  title, description, href, action,
}: { title: string; description: string; href: string; action: string }) {
  return (
    <section className="cw-callout">
      <div className="cw-wrap cw-callout-layout">
        <div><h2>{title}</h2><p>{description}</p></div>
        <Link className="cw-btn cw-btn-primary" href={href}>{action}<ArrowRight size={18} aria-hidden="true" /></Link>
      </div>
    </section>
  );
}

export function InteriorFigure({ src, alt, caption, equipment = false, sizes = "(max-width: 760px) 92vw, 520px" }: {
  src: string;
  alt: string;
  caption?: string;
  equipment?: boolean;
  sizes?: string;
}) {
  return (
    <figure className={equipment ? "cw-figure cw-figure-equipment" : "cw-figure"}>
      <div className="cw-figure-media"><Image src={src} alt={alt} fill sizes={sizes} /></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
