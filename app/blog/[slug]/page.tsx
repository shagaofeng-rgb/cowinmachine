import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articleBySlug, relatedProductsForArticle } from "@/lib/db";
import { articleJsonLd, siteUrl } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = articleBySlug("blog", slug);
  if (!article) return {};
  return {
    title: article.seo_title,
    description: article.seo_description,
    alternates: { canonical: siteUrl(`/blog/${article.slug}`) },
    openGraph: { title: article.title, description: article.excerpt, images: [article.cover_image_url], type: "article" },
    twitter: { card: "summary_large_image", title: article.title, description: article.excerpt, images: [article.cover_image_url] },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articleBySlug("blog", slug);
  if (!article) notFound();
  const related = relatedProductsForArticle("blog", article.id);
  return (
    <article className="content">
      <p className="meta"><a href="/blog">Blog</a><span>{new Date(article.published_at).toLocaleString()}</span></p>
      <h1>{article.title}</h1>
      <p><strong>{article.excerpt}</strong></p>
      <img className="media" src={article.cover_image_url} alt={article.cover_image_alt} />
      <section><h2>GEO Summary</h2><p>{article.geo_summary}</p><h2>Key Takeaways</h2><p>{article.key_takeaways}</p></section>
      <section dangerouslySetInnerHTML={{ __html: article.content }} />
      <section className="related"><h2>Related Products</h2><ul>{related.map((p) => <li key={p.id}><a href={`/products/${p.slug}`}>{p.english_name}</a> - {p.summary}</li>)}</ul></section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd("BlogPosting", article, related)) }} />
    </article>
  );
}
