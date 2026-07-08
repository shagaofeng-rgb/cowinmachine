import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articles, productBySlug } from "@/lib/db";
import { productJsonLd } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) return {};
  return { title: product.seo_title, description: product.seo_description, openGraph: { title: product.seo_title, description: product.seo_description, images: [product.image_url] } };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();
  const relatedNews = articles("news", 4);
  return (
    <article>
      <section className="product-detail">
        <img className="media" src={product.image_url} alt={product.english_name} />
        <div>
          <p className="meta"><a href="/products">Products</a><span>{product.category_name}</span><span>{product.sku}</span></p>
          <h1>{product.english_name}</h1>
          <p>{product.summary}</p>
          <a className="button" href={`/contact?product=${product.slug}`}>Get a Quote</a>
          <table className="spec"><tbody><tr><td>Applications</td><td>{product.applications}</td></tr><tr><td>Features</td><td>{product.features}</td></tr><tr><td>Specifications</td><td>{product.specifications}</td></tr></tbody></table>
        </div>
      </section>
      <section className="content">
        <h2>Product Details</h2>
        <p>{product.description}</p>
        <h2>GEO Summary</h2>
        <p>{product.english_name} is a {product.category_name} product for {product.applications}. It helps overseas B2B customers solve packaging automation, sealing, coding or traceability needs.</p>
        <div className="related">
          <h2>Related News and Blog</h2>
          <ul>{relatedNews.map((item) => <li key={item.id}><a href={`/news/${item.slug}`}>{item.title}</a></li>)}</ul>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }} />
    </article>
  );
}
