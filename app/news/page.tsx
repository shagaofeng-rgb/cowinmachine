import type { Metadata } from "next";
import { articles, relatedProductsForArticle } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "News",
  description: "Packaging machinery industry news with source attribution, product relationships, SEO and GEO summaries.",
};

export default function NewsPage() {
  const list = articles("news", 20);
  return (
    <>
      <div className="page-title"><h1>News</h1><p>News articles include source fields, publication time, product links, SEO metadata and machine-readable structure.</p></div>
      <section className="section">
        <div className="grid">
          {list.map((item) => {
            const related = relatedProductsForArticle("news", item.id);
            return (
              <article className="card" key={item.id}>
                <img className="media" src={item.cover_image_url} alt={item.cover_image_alt} loading="lazy" />
                <div className="card-body">
                  <p className="meta"><span>{new Date(item.published_at).toLocaleDateString()}</span><span>{item.source_publisher}</span></p>
                  <h3>{item.title}</h3>
                  <p>{item.excerpt}</p>
                  <p className="meta">Related: {related.map((p) => p.english_name).join(", ")}</p>
                  <a className="button secondary" href={`/news/${item.slug}`}>Read details</a>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
