import Link from "next/link";
import { ArrowRight, BookOpenText, Newspaper } from "@phosphor-icons/react/ssr";
import { EditorialDate, EditorialMedia } from "@/components/content-automation/EditorialMedia";
import { InteriorIntro } from "@/components/interior/Interior";
import { Pagination } from "@/components/Pagination";
import type { PublishedArticleCard } from "@/lib/content-automation/storage";

type ContentIndexProps = {
  articles: PublishedArticleCard[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  sectionPath: "/news" | "/blog";
  industryFilters?: Array<{ label: string; count: number }>;
  activeIndustry?: string;
  kicker: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
};

function ArticleMeta({ article }: { article: PublishedArticleCard }) {
  return (
    <div className="cw-editorial-meta">
      {article.industry && <span>{article.industry}</span>}
      <EditorialDate value={article.publishedAt} />
    </div>
  );
}

export function ContentIndex({
  articles, totalItems, currentPage, totalPages, sectionPath, industryFilters, activeIndustry,
  kicker, title, description, emptyTitle, emptyDescription,
}: ContentIndexProps) {
  const isBlog = sectionPath === "/blog";
  const channel = isBlog ? "Blog" : "News";
  const EmptyIcon = isBlog ? BookOpenText : Newspaper;
  const featured = !isBlog && currentPage === 1 ? articles[0] : undefined;
  const remaining = featured ? articles.slice(1) : articles;
  const articleHref = (slug: string) => `${sectionPath}/${slug}`;

  return (
    <div className={`cw-interior ${isBlog ? "cw-blog-index" : "cw-news-index"}`}>
      <InteriorIntro items={[{ label: channel }]} label={kicker} title={title} description={description} />
      <section className="cw-section cw-editorial-index">
        <div className="cw-wrap">
          {industryFilters?.length ? (
            <nav className="cw-news-filters" aria-label="Filter news by industry">
              <Link aria-current={!activeIndustry ? "page" : undefined} href={sectionPath}>All updates <span>{industryFilters.reduce((total, filter) => total + filter.count, 0)}</span></Link>
              {industryFilters.map((filter) => (
                <Link key={filter.label} aria-current={filter.label === activeIndustry ? "page" : undefined} href={`${sectionPath}?industry=${encodeURIComponent(filter.label)}`}>
                  {filter.label} <span>{filter.count}</span>
                </Link>
              ))}
            </nav>
          ) : null}

          {featured && (
            <article className="cw-news-feature">
              <EditorialMedia image={featured.image} channel={sectionPath} sizes="(max-width: 760px) 92vw, 580px" eager />
              <div className="cw-news-feature-copy">
                <p className="cw-kicker">{activeIndustry ? "Latest in this industry" : "Latest update"}</p>
                <ArticleMeta article={featured} />
                <h2><Link href={articleHref(featured.slug)}>{featured.title}</Link></h2>
                <p>{featured.summary}</p>
                <Link className="cw-link" href={articleHref(featured.slug)}>Read the update <ArrowRight size={17} aria-hidden="true" /></Link>
              </div>
            </article>
          )}

          {!articles.length && (
            <div className="cw-empty">
              <EmptyIcon size={33} aria-hidden="true" />
              <h2>{emptyTitle}</h2><p>{emptyDescription}</p>
              <Link className="cw-link" href={activeIndustry ? "/news" : isBlog ? "/products" : "/blog"}>
                {activeIndustry ? "Show all updates" : isBlog ? "Browse equipment" : "Browse equipment guides"} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          )}

          {remaining.length > 0 && <>
            <div className="cw-editorial-heading">
              <h2>{isBlog ? "Equipment guides" : "News archive"}</h2>
              <p>{totalItems} {isBlog ? "guides" : "updates"}{totalPages > 1 ? ` / Page ${currentPage} of ${totalPages}` : ""}</p>
            </div>
            <div className={isBlog ? "cw-guide-grid" : "cw-news-archive"}>
              {remaining.map((article) => (
                <article className={isBlog ? "cw-guide-card" : "cw-news-row"} key={article.id}>
                  {isBlog || article.image ? <EditorialMedia image={article.image} channel={sectionPath} sizes={isBlog ? "(max-width: 540px) 92vw, (max-width: 860px) 45vw, 390px" : "150px"} /> : <div className="cw-news-row-icon" aria-hidden="true"><Newspaper size={29} /></div>}
                  <div className="cw-editorial-card-copy">
                    <ArticleMeta article={article} />
                    <h3><Link href={articleHref(article.slug)}>{article.title}</Link></h3>
                    <p>{article.summary}</p>
                    <Link className="cw-link" href={articleHref(article.slug)} aria-label={`Read ${article.title}`}>{isBlog ? "Read guide" : "Read update"} <ArrowRight size={16} aria-hidden="true" /></Link>
                  </div>
                </article>
              ))}
            </div>
          </>}
          <Pagination basePath={sectionPath} currentPage={currentPage} totalPages={totalPages} query={activeIndustry ? { industry: activeIndustry } : undefined} ariaLabel={`${channel} pagination`} />
        </div>
      </section>
    </div>
  );
}
