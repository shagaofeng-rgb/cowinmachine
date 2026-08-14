import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleStructuredData } from "@/components/content-automation/ArticleStructuredData";
import { getPublishedArticles } from "@/lib/content-automation/storage";

export const dynamic = "force-dynamic";

async function getArticle(slug: string) {
  return (await getPublishedArticles()).find((article) => article.slug === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const article = await getArticle((await params).slug);
  if (!article) return { robots: { index: false, follow: false } };

  const url = `/news/${article.slug}`;
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary,
      url,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
    },
    robots: { index: true, follow: true },
  };
}

function ArticleBody({ body }: { body: string }) {
  return <div className="article-body">{body.split("\n").filter((line) => line && !line.startsWith("# ") && !line.startsWith("> ")).map((line, index) => {
    if (line.startsWith("## ")) return <h2 key={index}>{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={index}>{line.slice(4)}</h3>;
    if (line.startsWith("- ")) return <p key={index}>— {line.slice(2)}</p>;
    return <p key={index}>{line.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")}</p>;
  })}</div>;
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = await getArticle((await params).slug);
  if (!article) notFound();

  const published = article.publishedAt ? new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(article.publishedAt)) : "Pending";
  const updated = new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(article.updatedAt));

  return <>
    <ArticleStructuredData article={article} />
    <article className="section">
      <div className="content-wrap">
        <nav aria-label="Breadcrumb"><Link href="/">Home</Link> / <Link href="/news">News &amp; Blog</Link> / <span>{article.title}</span></nav>
        <p className="eyebrow">{article.industry}</p>
        <h1>{article.title}</h1>
        <p>{article.summary}</p>
        <p className="form-status">Published: {published} · Updated: {updated}</p>
        <ArticleBody body={article.body} />
        <section>
          <h2>Sources and further reading</h2>
          <ul>{article.sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.name}</a> — published {source.publishedAt}</li>)}</ul>
        </section>
        <section className="card">
          <h2>Discuss your application</h2>
          <p>Share the operating conditions and required quantity for a configuration review.</p>
          <Link className="button button-primary" href={`/request-a-quote?productUrl=${encodeURIComponent(article.productUrl)}`}>Request a Technical Review</Link>
        </section>
      </div>
    </article>
  </>;
}
