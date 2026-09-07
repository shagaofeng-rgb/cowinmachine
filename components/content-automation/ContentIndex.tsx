import Image from "next/image";
import Link from "next/link";
import { Pagination } from "@/components/Pagination";
import type { ContentArticle } from "@/types/content-automation";

type ContentIndexProps = {
  articles: ContentArticle[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
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
  totalItems,
  currentPage,
  totalPages,
  sectionPath,
  kicker,
  title,
  description,
  emptyTitle,
  emptyDescription,
}: ContentIndexProps) {
  const featured = currentPage === 1 ? articles[0] : undefined;
  const remaining = currentPage === 1 ? articles.slice(1) : articles;
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
              {totalItems ? String(totalItems).padStart(2, "0") : "00"} <span>published items</span>
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
              <div>
                <p className="news-kicker">{currentPage === 1 ? "Latest archive" : "Archive"}</p>
                <h2>{currentPage === 1 ? "More from COWIN MACHINE" : `Page ${currentPage} of ${totalPages}`}</h2>
              </div>
              <p>{totalItems} published items · Up to 9 per page</p>
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
          <Pagination basePath={sectionPath} currentPage={currentPage} totalPages={totalPages} ariaLabel={`${title} pagination`} />
        </div>
      </section>
    </main>
  );
}
