import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleStructuredData } from "@/components/content-automation/ArticleStructuredData";
import { getPublishedArticles } from "@/lib/content-automation/storage";

export const dynamic = "force-dynamic";
async function getArticle(slug: string) { return (await getPublishedArticles()).find((article) => article.slug === slug); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const article = await getArticle((await params).slug);
  if (!article) return { robots: { index: false, follow: false } };
  const url = "/news/" + article.slug;
  return { title: article.title, description: article.summary, alternates: { canonical: url }, openGraph: { type: "article", title: article.title, description: article.summary, url, publishedTime: article.publishedAt, modifiedTime: article.updatedAt, images: article.image ? [{ url: article.image.src, alt: article.image.alt }] : undefined }, robots: { index: true, follow: true } };
}

function InlineMarkdown({ value }: { value: string }) {
  const match = value.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  return match ? <Link href={match[2]}>{match[1]} <span aria-hidden="true">→</span></Link> : <>{value}</>;
}
function ArticleBody({ body }: { body: string }) {
  return <div className="news-prose">{body.split("\n").filter((line) => line && !line.startsWith("# ") && !line.startsWith("> ")).map((line, index) => {
    if (line.startsWith("## ")) return <h2 key={index}>{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={index}>{line.slice(4)}</h3>;
    if (line.startsWith("- ")) return <p className="news-prose-link" key={index}><InlineMarkdown value={line.slice(2)} /></p>;
    return <p key={index}>{line}</p>;
  })}</div>;
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = await getArticle((await params).slug);
  if (!article) notFound();
  const published = article.publishedAt ? new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(article.publishedAt)) : "Pending";
  const updated = new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(article.updatedAt));
  const type = article.sources.length ? "Industry update" : "Technical brief";
  return <><ArticleStructuredData article={article} /><main className="news-article">
    <section className="news-article-hero"><div className="content-wrap">
      <nav className="news-breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/news">News</Link><span>/</span><span>{type}</span></nav>
      <div className="news-article-hero-grid"><div className="news-article-hero-copy"><div className="news-card-meta news-card-meta-light"><span>{type}</span><span>{article.industry}</span></div><h1>{article.title}</h1><p>{article.summary}</p><p className="news-date-line">Published {published} <span aria-hidden="true">•</span> Updated {updated}</p></div>{article.image ? <div className="news-article-hero-media"><Image src={article.image.src} alt={article.image.alt} fill priority sizes="(max-width: 900px) 100vw, 40vw" /></div> : null}</div>
    </div></section>
    <section className="section news-article-content"><div className="content-wrap news-article-layout">
      <div className="news-article-main"><ArticleBody body={article.body} /></div>
      <aside className="news-article-aside" aria-label="Article actions"><div className="news-aside-card"><p className="news-kicker">Configuration review</p><h2>Discuss this application</h2><p>Share your project conditions and required quantity for a focused equipment review.</p><Link className="button button-primary" href={"/request-a-quote?productUrl=" + encodeURIComponent(article.productUrl)}>Request a Quote</Link><a className="news-aside-secondary" href="https://wa.me/8615665135205">WhatsApp Us <span aria-hidden="true">↗</span></a></div><div className="news-aside-product"><p className="news-kicker">Related equipment</p><Link href={article.productUrl}>View product details <span aria-hidden="true">→</span></Link></div>{article.sources.length ? <div className="news-aside-sources"><p className="news-kicker">Sources</p><p>External reporting is cited for context and does not indicate a commercial relationship with COWIN MACHINE.</p></div> : null}</aside>
    </div></section>
  </main></>;
}
