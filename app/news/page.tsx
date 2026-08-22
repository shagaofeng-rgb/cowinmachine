import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedArticles } from "@/lib/content-automation/storage";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata("News", "Source-reviewed industrial equipment and application news from COWIN MACHINE.", "/news");

function formatDate(value?: string) {
  return value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "Technical brief";
}

export default async function NewsPage() {
  const articles = await getPublishedArticles();
  const [featured, ...remaining] = articles;
  return (
    <main className="news-index">
      <section className="news-index-intro"><div className="content-wrap">
        <p className="news-kicker">COWIN MACHINE / FIELD NOTES</p>
        <div className="news-index-title-row"><div><h1>News &amp; Technical Briefs</h1><p>Practical equipment context for industrial buyers, project teams and application reviews.</p></div><p className="news-index-count">{articles.length ? String(articles.length).padStart(2, "0") : "00"} <span>published items</span></p></div>
      </div></section>
      <section className="section news-index-content"><div className="content-wrap">
        {featured ? <article className="news-featured-card">
          <div className="news-featured-copy">
            <div className="news-card-meta"><span>{featured.industry}</span><span>{formatDate(featured.publishedAt)}</span></div>
            <p className="news-type-label">{featured.sources.length ? "Industry update" : "Technical brief"}</p>
            <h2><Link href={"/news/" + featured.slug}>{featured.title}</Link></h2>
            <p>{featured.summary}</p><Link className="news-read-link" href={"/news/" + featured.slug}>Read the brief <span aria-hidden="true">→</span></Link>
          </div>
          {featured.image ? <Link className="news-featured-media" href={"/news/" + featured.slug} aria-label={"Read " + featured.title}><Image src={featured.image.src} alt={featured.image.alt} fill sizes="(max-width: 900px) 100vw, 42vw" priority /></Link> : <div className="news-featured-media news-featured-media-placeholder" aria-hidden="true" />}
        </article> : <div className="news-empty-state"><p className="news-kicker">Publishing queue</p><h2>Today&apos;s technical brief is being prepared.</h2><p>Source-reviewed industry updates and verified-product technical briefs appear here after their publication checks finish.</p></div>}
        {remaining.length > 0 ? <div className="news-section-heading"><p className="news-kicker">Latest archive</p><h2>More from the field</h2></div> : null}
        <div className="news-card-grid">{remaining.map((article) => <article className="news-list-card" key={article.id}>
          {article.image ? <div className="news-list-card-media"><Image src={article.image.src} alt={article.image.alt} fill sizes="(max-width: 700px) 100vw, 33vw" /></div> : null}
          <div className="news-list-card-content"><div className="news-card-meta"><span>{article.industry}</span><span>{formatDate(article.publishedAt)}</span></div><h2><Link href={"/news/" + article.slug}>{article.title}</Link></h2><p>{article.summary}</p><Link className="news-read-link" href={"/news/" + article.slug}>Read article <span aria-hidden="true">→</span></Link></div>
        </article>)}</div>
      </div></section>
    </main>
  );
}
