import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articleBySlug, relatedProductsForArticle } from "@/lib/db";
import { articleJsonLd, siteUrl } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = articleBySlug("news", slug);
  if (!article) return {};
  return {
    title: article.seo_title,
    description: article.seo_description,
    alternates: { canonical: siteUrl(`/news/${article.slug}`) },
    openGraph: { title: article.title, description: article.excerpt, images: [article.cover_image_url], type: "article" },
    twitter: { card: "summary_large_image", title: article.title, description: article.excerpt, images: [article.cover_image_url] },
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articleBySlug("news", slug);
  if (!article) notFound();
  const related = relatedProductsForArticle("news", article.id);
  return (
    <article className="content">
      <p className="meta"><a href="/news">News</a><span>{new Date(article.published_at).toLocaleString()}</span><span>Updated {new Date(article.updated_at || article.published_at).toLocaleDateString()}</span></p>
      <h1>{article.title}</h1>
      <p><strong>{article.excerpt}</strong></p>
      <img className="media" src={article.cover_image_url} alt={article.cover_image_alt} />
      <section><h2>Key Takeaways</h2><p>{article.key_takeaways}</p></section>
      <section dangerouslySetInnerHTML={{ __html: article.content }} />
      <section className="related">
        <h2>Related Products</h2>
        <div className="grid">
          {related.map((product) => (
            <article className="card" key={product.id}>
              <img className="media" src={product.image_url} alt={product.english_name} />
              <div className="card-body"><h3>{product.english_name}</h3><p>{product.summary}</p><a className="button secondary" href={`/products/${product.slug}`}>Product details</a></div>
            </article>
          ))}
        </div>
      </section>
      <section className="related">
        <h2>Source Information</h2>
        <p>Original title: {article.source_title}</p>
        <p>Publisher: {article.source_publisher}</p>
        <p>Original published at: {new Date(article.source_published_at).toLocaleString()}</p>
        <p>Fetched at: {new Date(article.source_fetched_at).toLocaleString()}</p>
        <p><a href={article.source_url} rel="nofollow noopener noreferrer">Original source</a></p>
        <p className="meta">This article is based on public source information with independent analysis. Original reporting belongs to the original publisher.</p>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd("NewsArticle", article, related)) }} />
    </article>
  );
}
