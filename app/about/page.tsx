import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { productCategories } from "@/lib/products";
import { siteConfig } from "@/lib/site";
export const metadata: Metadata = { title: "About Us", description: siteConfig.companyIntroduction };
export default function AboutPage() { return <><PageHero eyebrow="About COWIN MACHINE" title="About Our Company" description={siteConfig.companyIntroduction} /><section className="section"><div className="content-wrap"><h2>What We Supply</h2><div className="grid">{productCategories.map((category) => <div className="card" key={category.slug}><h3>{category.name}</h3><p>{category.summary}</p></div>)}</div></div></section><section className="section section-alt"><div className="content-wrap"><h2>How We Work</h2><p>Technical Consultation → Equipment Selection → Production / Integration → Inspection → Delivery → After-sales Support</p><p>TODO: Replace with verified COWIN MACHINE company information.</p><Link className="button button-primary" href="/contact">Contact Our Team</Link></div></section></>; }
