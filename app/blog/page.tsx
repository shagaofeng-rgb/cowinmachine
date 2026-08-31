import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

const baseMetadata: Metadata = pageMetadata(
  "Blog",
  "Practical equipment-selection notes and application guidance from COWIN MACHINE.",
  "/blog",
);
export const metadata: Metadata = { ...baseMetadata, robots: { index: false, follow: true } };

export default function BlogPage() {
  return <section className="section"><div className="content-wrap"><p className="eyebrow">Equipment guidance</p><h1>Blog</h1><p>Practical notes help B2B buyers prepare equipment requirements, compare configurations and discuss application conditions with our team.</p><div className="card"><h2>Start with the current technical briefs</h2><p>Read source-reviewed industry context in News, use the product catalog to review equipment categories, or send your project conditions for a configuration review.</p><div className="cta-row"><Link className="button button-outline" href="/news">Read Technical Briefs</Link><Link className="button button-primary" href="/request-a-quote">Request a Technical Review</Link></div></div></div></section>;
}
