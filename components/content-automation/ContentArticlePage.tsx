import Image from "next/image";
import Link from "next/link";
import { ArticleStructuredData } from "@/components/content-automation/ArticleStructuredData";
import type { ContentArticle } from "@/types/content-automation";

type ContentArticlePageProps = {
  article: ContentArticle;
  relatedArticles?: ContentArticle[];
  sectionName: "News" | "Blog";
  sectionPath: "/news" | "/blog";
};

function InlineMarkdown({ value }: { value: string }) {
  const match = value.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  return match ? <Link href={match[2]}>{match[1]} <span aria-hidden="true">→</span></Link> : <>{value}</>;
}

function sectionId(index: number) {
  return `article-section-${index}`;
}

function articleLines(body: string) {
  return body
    .split("\n")
    .filter((line) => line && !line.startsWith("# ") && !line.startsWith("> "));
}

function getArticleHeadings(body: string) {
  return articleLines(body)
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.startsWith("## "))
    .map(({ line, index }) => ({ id: sectionId(index), label: line.slice(3) }));
}

function ArticleBody({ body }: { body: string }) {
  return (
    <div className="news-prose">
      {articleLines(body)
        .map((line, index) => {
          if (line.startsWith("## ")) return <h2 id={sectionId(index)} key={index}>{line.slice(3)}</h2>;
          if (line.startsWith("### ")) return <h3 key={index}>{line.slice(4)}</h3>;
          if (line.startsWith("- ")) return <p className="news-prose-link" key={index}><InlineMarkdown value={line.slice(2)} /></p>;
          return <p key={index}>{line}</p>;
        })}
    </div>
  );
}

export function ContentArticlePage({ article, relatedArticles = [], sectionName, sectionPath }: ContentArticlePageProps) {
  const published = article.publishedAt
    ? new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(article.publishedAt))
    : "Pending";
  const updated = new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(article.updatedAt));
  const type = sectionPath === "/blog" ? "Equipment guide" : "Industry update";
  const headings = getArticleHeadings(article.body);
  const readingMinutes = Math.max(1, Math.ceil(article.body.trim().split(/\s+/).filter(Boolean).length / 220));

  return (
    <>
      <ArticleStructuredData article={article} />
      <main className="news-article">
        <section className="news-article-hero">
          <div className="content-wrap">
            <nav className="news-breadcrumbs" aria-label="Breadcrumb">
              <Link href="/">Home</Link><span>/</span><Link href={sectionPath}>{sectionName}</Link><span>/</span><span>{type}</span>
            </nav>
            <div className="news-article-hero-grid">
              <div className="news-article-hero-copy">
                <div className="news-card-meta news-card-meta-light"><span>{type}</span><span>{article.industry}</span></div>
                <h1>{article.title}</h1>
                <p>{article.summary}</p>
                <p className="news-date-line">Published {published} <span aria-hidden="true">•</span> Updated {updated} <span aria-hidden="true">•</span> {readingMinutes} min read</p>
              </div>
              {article.image ? (
                <div className="news-article-hero-media">
                  <Image src={article.image.src} alt={article.image.alt} fill priority sizes="(max-width: 900px) 100vw, 40vw" />
                </div>
              ) : null}
            </div>
          </div>
        </section>
        <section className="section news-article-content">
          <div className="content-wrap news-article-layout">
            <div className="news-article-main"><ArticleBody body={article.body} /></div>
            <aside className="news-article-aside" aria-label="Article actions">
              {headings.length ? <nav className="news-article-outline" aria-label="Article outline"><p className="news-kicker">In this article</p>{headings.map((heading) => <a key={heading.id} href={`#${heading.id}`}>{heading.label}</a>)}</nav> : null}
              <div className="news-aside-card">
                <p className="news-kicker">Configuration review</p>
                <h2>Discuss this application</h2>
                <p>Share your project conditions and required quantity for a focused equipment review.</p>
                <Link className="button button-primary" href={"/request-a-quote?productUrl=" + encodeURIComponent(article.productUrl)}>Request a Quote</Link>
                <a className="news-aside-secondary" href="https://wa.me/8615665135205">WhatsApp Us <span aria-hidden="true">↗</span></a>
              </div>
              <div className="news-aside-product">
                <p className="news-kicker">Related equipment</p>
                <Link href={article.productUrl}>View product details <span aria-hidden="true">→</span></Link>
              </div>
              {article.sources.length ? (
                <div className="news-aside-sources">
                  <p className="news-kicker">Sources</p>
                  <p>External reporting is cited for context and does not indicate a commercial relationship with COWIN MACHINE.</p>
                  <ul>{article.sources.slice(0, 3).map((source) => <li key={source.id}><a href={source.url} rel="noreferrer">{source.name} <span aria-hidden="true">↗</span></a></li>)}</ul>
                </div>
              ) : null}
            </aside>
          </div>
        </section>
        {relatedArticles.length ? <section className="news-article-next"><div className="content-wrap"><div className="news-article-next-heading"><p className="news-kicker">Continue reading</p><h2>More industry developments</h2></div><div className="news-article-next-grid">{relatedArticles.map((relatedArticle) => <article key={relatedArticle.id}><p>{relatedArticle.industry}</p><h3><Link href={`${sectionPath}/${relatedArticle.slug}`}>{relatedArticle.title}</Link></h3><Link href={`${sectionPath}/${relatedArticle.slug}`}>Read article <span aria-hidden="true">→</span></Link></article>)}</div></div></section> : null}
      </main>
    </>
  );
}
