import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { productCategories } from "@/lib/products";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = { title: "About", description: siteConfig.companyIntroduction };
export default function AboutPage() {
  return <><PageHero eyebrow="About cowinmachine" title="Independent Product Information" description={siteConfig.companyIntroduction} />
    <section className="section"><div className="content-wrap"><h2>Product Focus</h2><div className="grid">{productCategories.map((category) => <div className="card" key={category.slug}><h3>{category.name}</h3><p>{category.summary}</p></div>)}</div></div></section>
    <section className="section section-alt"><div className="content-wrap"><h2>Review Before Publication</h2><p>Company information, product specifications, image rights and technical documents are verified before public product claims are made.</p><p>REVIEW REQUIRED: legal company name and registered address.</p><Link className="button button-primary" href="/contact">Contact Our Team</Link></div></section>
  </>;
}
