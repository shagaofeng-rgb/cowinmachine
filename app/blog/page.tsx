import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "Blog",
  "Practical equipment-selection notes and application guidance from COWIN MACHINE.",
  "/blog",
);

export default function BlogPage() {
  return <section className="section"><div className="content-wrap"><p className="eyebrow">Equipment guidance</p><h1>Blog</h1><p>Practical notes to help B2B buyers prepare equipment requirements, compare configurations and discuss application conditions with our team.</p><div className="card"><h2>Application guidance is being prepared</h2><p>Use the product catalogue to review equipment categories, or send your project conditions for a configuration review.</p><Link className="button button-primary" href="/request-a-quote">Request a Technical Review</Link></div></div></section>;
}
