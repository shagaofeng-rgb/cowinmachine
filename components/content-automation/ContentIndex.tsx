import Image from "next/image";
import Link from "next/link";
import type { ContentArticle } from "@/types/content-automation";

type ContentIndexProps = {
  articles: ContentArticle[];
  sectionPath: "/news" | "/blog";
  kicker: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
};

function formatDate(value?: string) {
  return value
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
    : "Editorial article";
}

export function ContentIndex({
  articles,
  sectionPath,
  kicker,
  title,
  description,
  emptyTitle,
  emptyDescription,
}: ContentIndexProps) {
  const [featured, ...remaining] = articles;
  const itemType = sectionPath === "/blog" ? "Equipment guide" : "Industry update";
  const articleHref = (slug: string) => sectionPath + "/" + slug;

  return (
    <main className="news-index">
      <section className="news-index-intro">
        <div className="content-wrap">
          <p className="news-kicker">{kicker}</p>
          <div className="news-index-title-row">
            <div>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
            <p className="news-index-count">
              {articles.length ? String(articles.length).padStart(2, "0") : "00"} <span>published items</span>
            </p>
          </div>
        </div>
      </section>

      <section className="section news-index-content">
        <div className="content-wrap">
          {featured ? (
            <article className="news-featured-card">
              <div className="news-featured-copy">
                <div className="news-card-meta">
                  <span>{featured.industry}</span>
                  <span>{formatDate(featured.publishedAt)}</span>
                </div>
                <p className="news-type-label">{itemType}</p>
                <h2><Link href={articleHref(featured.slug)}>{featured.title}</Link></h2>
                <p>{featured.summary}</p>
                <Link className="news-read-link" href={articleHref(featured.slug)}>
                  Read the article <span aria-hidden="true">→</span>
                </Link>
              </div>
              {featured.image ? (
                <Link className="news-featured-media" href={articleHref(featured.slug)} aria-label={"Read " + featured.title}>
                  <Image src={featured.image.src} alt={featured.image.alt} fill sizes="(max-width: 900px) 100vw, 42vw" priority />
                </Link>
              ) : (
                <div className="news-featured-media news-featured-media-placeholder" aria-hidden="true" />
              )}
            </article>
          ) : (
            <div className="news-empty-state">
              <p className="news-kicker">Publishing queue</p>
              <h2>{emptyTitle}</h2>
              <p>{emptyDescription}</p>
            </div>
          )}

          {remaining.length > 0 ? (
            <div className="news-section-heading">
              <p className="news-kicker">Latest archive</p>
              <h2>More from COWIN MACHINE</h2>
            </div>
          ) : null}

          <div className="news-card-grid">
            {remaining.map((article) => (
              <article className="news-list-card" key={article.id}>
                {article.image ? (
                  <div className="news-list-card-media">
                    <Image src={article.image.src} alt={article.image.alt} fill sizes="(max-width: 700px) 100vw, 33vw" />
                  </div>
                ) : null}
                <div className="news-list-card-content">
                  <div className="news-card-meta">
                    <span>{article.industry}</span>
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>
                  <h2><Link href={articleHref(article.slug)}>{article.title}</Link></h2>
                  <p>{article.summary}</p>
                  <Link className="news-read-link" href={articleHref(article.slug)}>
                    Read article <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
