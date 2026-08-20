import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedArticles } from "@/lib/content-automation/storage";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata("News", "Source-reviewed industrial equipment and application news from COWIN MACHINE.", "/news");

export default async function NewsPage() {
  const articles = await getPublishedArticles();
  return <section className="section"><div className="content-wrap"><p className="eyebrow">Industry updates</p><h1>News</h1><p>Source-reviewed updates on industrial equipment, project conditions and application developments. Product configuration remains subject to application review.</p>{articles.length ? <div className="grid">{articles.map((article) => <article className="card" key={article.id}><p className="eyebrow">{article.industry}</p><h2><Link href={`/news/${article.slug}`}>{article.title}</Link></h2><p>{article.summary}</p><Link className="button button-outline" href={`/news/${article.slug}`}>Read News</Link></article>)}</div> : <div className="card"><h2>No news articles yet</h2><p>Source-reviewed industry updates will appear here after they pass the configured publishing checks.</p></div>}</div></section>;
}
