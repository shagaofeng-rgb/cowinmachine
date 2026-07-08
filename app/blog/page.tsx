import type { Metadata } from "next";
import { articles, relatedProductsForArticle } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: "B2B packaging machinery blog posts with product links, SEO and GEO fields.",
};

export default function BlogPage() {
  const list = articles("blog", 20);
  return (
    <>
      <div className="page-title"><h1>Blog</h1><p>Operational articles connect products, inquiries, content, SEO and GEO.</p></div>
      <section className="section">
        <div className="grid">
          {list.map((item) => {
            const related = relatedProductsForArticle("blog", item.id);
            return (
              <article className="card" key={item.id}>
                <img className="media" src={item.cover_image_url} alt={item.cover_image_alt} loading="lazy" />
                <div className="card-body">
                  <p className="meta"><span>{new Date(item.published_at).toLocaleDateString()}</span><span>{related.map((p) => p.english_name).join(", ")}</span></p>
                  <h3>{item.title}</h3>
                  <p>{item.excerpt}</p>
                  <a className="button secondary" href={`/blog/${item.slug}`}>Read blog</a>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
