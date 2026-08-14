import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedArticles } from "@/lib/content-automation/storage";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata("News & Blog", "Source-reviewed industry news and original equipment-selection guidance from COWIN MACHINE.", "/news");

export default async function NewsPage() {
  const articles = await getPublishedArticles();
  return <section className="section"><div className="content-wrap"><p className="eyebrow">Industry context</p><h1>News &amp; Blog</h1><p>Published articles combine original operational guidance with linked source material. Product configuration remains subject to application review.</p>{articles.length ? <div className="grid">{articles.map((article) => <article className="card" key={article.id}><p className="eyebrow">{article.industry}</p><h2><Link href={`/news/${article.slug}`}>{article.title}</Link></h2><p>{article.summary}</p><Link className="button button-outline" href={`/news/${article.slug}`}>Read Article</Link></article>)}</div> : <div className="card"><h2>No published articles yet</h2><p>When an article passes the configured source, originality and publishing checks, it will appear here.</p></div>}</div></section>;
}
