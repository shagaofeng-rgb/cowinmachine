import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import { ArticleStructuredData } from "@/components/content-automation/ArticleStructuredData";
import { EditorialDate, EditorialMedia } from "@/components/content-automation/EditorialMedia";
import { InteriorBreadcrumbs } from "@/components/interior/Interior";
import { normalizeInquiryProductUrl } from "@/lib/inquiry-context";
import { whatsappHref } from "@/lib/site";
import type { ContentArticle } from "@/types/content-automation";

type ContentArticlePageProps = {
  article: ContentArticle;
  relatedArticles?: ContentArticle[];
  sectionName: "News" | "Blog";
  sectionPath: "/news" | "/blog";
};

function safeArticleLink(value: string) {
  if (/^\/(?![\/\\])/.test(value)) return value;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function InlineMarkdown({ value }: { value: string }) {
  const match = value.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (!match) return <>{value}</>;
  const href = safeArticleLink(match[2]);
  return href ? <a href={href}>{match[1]}</a> : <>{match[1]}</>;
}

function sectionId(index: number) {
  return `article-section-${index}`;
}

function articleLines(body: string) {
  return body.split("\n").filter((line) => line && !line.startsWith("# ") && !line.startsWith("> "));
}

function ArticleBody({ lines }: { lines: string[] }) {
  const blocks: ReactNode[] = [];
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (line.startsWith("## ")) blocks.push(<h2 id={sectionId(index)} key={index}>{line.slice(3)}</h2>);
    else if (line.startsWith("### ")) blocks.push(<h3 key={index}>{line.slice(4)}</h3>);
    else if (line.startsWith("- ")) {
      const start = index;
      const items = [line.slice(2)];
      while (lines[index + 1]?.startsWith("- ")) items.push(lines[++index].slice(2));
      blocks.push(<ul key={start}>{items.map((item, itemIndex) => <li key={itemIndex}><InlineMarkdown value={item} /></li>)}</ul>);
    } else blocks.push(<p key={index}><InlineMarkdown value={line} /></p>);
  }

  return <div className="cw-prose">{blocks}</div>;
}

export function ContentArticlePage({ article, relatedArticles = [], sectionName, sectionPath }: ContentArticlePageProps) {
  const isBlog = sectionPath === "/blog";
  const type = isBlog ? "Equipment guide" : "Industry update";
  const lines = articleLines(article.body);
  const headings = lines.flatMap((line, index) => line.startsWith("## ") ? [{ id: sectionId(index), label: line.slice(3) }] : []);
  const readingMinutes = Math.max(1, Math.ceil(article.body.trim().split(/\s+/).filter(Boolean).length / 220));
  const normalizedProductUrl = normalizeInquiryProductUrl(article.productUrl);
  const productPath = normalizedProductUrl ? new URL(normalizedProductUrl).pathname : "/products";
  const quoteHref = productPath !== "/products" ? `/request-a-quote?productUrl=${encodeURIComponent(productPath)}` : "/request-a-quote";
  const sources = article.sources.flatMap((source) => {
    const href = safeArticleLink(source.url);
    return href ? [{ ...source, href }] : [];
  });

  return (
    <div className="cw-interior">
      <ArticleStructuredData article={article} />
      <article className={`cw-article ${isBlog ? "cw-article-blog" : "cw-article-news"}`}>
        <header className="cw-article-header">
          <div className="cw-wrap">
            <InteriorBreadcrumbs items={[{ label: sectionName, href: sectionPath }, { label: type }]} />
            <div className="cw-title cw-article-title">
              <p className="cw-kicker">{type}{article.industry && article.industry !== type ? ` / ${article.industry}` : ""}</p>
              <h1>{article.title}</h1>
              {article.summary && <p>{article.summary}</p>}
              <div className="cw-editorial-meta cw-article-dates">
                {article.publishedAt && <span>Published <EditorialDate value={article.publishedAt} long /></span>}
                {article.updatedAt && article.updatedAt.slice(0, 10) !== article.publishedAt?.slice(0, 10) && <span>Updated <EditorialDate value={article.updatedAt} long /></span>}
                <span>{readingMinutes} min read</span>
              </div>
            </div>
          </div>
        </header>
        <div className={`cw-wrap cw-article-layout${headings.length >= 3 ? " cw-article-with-outline" : ""}`}>
          {headings.length >= 3 && (
            <aside className="cw-article-outline">
              <details open>
                <summary>In this article</summary>
                <nav aria-label="Article outline"><ol>{headings.map(({ id, label }) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}</ol></nav>
              </details>
            </aside>
          )}
          <div className="cw-article-main">
            {article.image && <EditorialMedia image={article.image} channel={sectionPath} sizes="(max-width: 760px) 92vw, 760px" eager />}
            <ArticleBody lines={lines} />
            {sources.length > 0 && <section className="cw-article-sources"><h2>Sources</h2><ul>{sources.map((source) => <li key={source.id}><a className="cw-link" href={source.href} rel="noreferrer">{source.name}<ArrowUpRight size={15} aria-hidden="true" /></a></li>)}</ul></section>}
            <section className="cw-article-cta">
              <h2>Discuss your equipment requirements</h2>
              <div>
                <Link className="cw-btn cw-btn-primary" href={quoteHref}>Request a quote <ArrowRight size={17} aria-hidden="true" /></Link>
                <Link className="cw-btn cw-btn-outline" href={productPath}>{productPath === "/products" ? "Browse equipment" : "View related equipment"}</Link>
                <a className="cw-link" href={whatsappHref}>WhatsApp</a>
              </div>
            </section>
            <Link className="cw-link cw-article-back" href={sectionPath}><ArrowLeft size={16} aria-hidden="true" />Back to {sectionName}</Link>
          </div>
        </div>
      </article>
      {relatedArticles.length > 0 && <section className="cw-section cw-section-muted">
        <div className="cw-wrap">
          <div className="cw-section-title"><h2>{isBlog ? "More equipment guides" : "More industry updates"}</h2></div>
          <ul className="cw-related-articles">
            {relatedArticles.map((related) => <li key={related.id}>
              <Link href={`${sectionPath}/${related.slug}`}><span><EditorialDate value={related.publishedAt} /><strong>{related.title}</strong></span><ArrowRight size={18} aria-hidden="true" /></Link>
            </li>)}
          </ul>
        </div>
      </section>}
    </div>
  );
}
