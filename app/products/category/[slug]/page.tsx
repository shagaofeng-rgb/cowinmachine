import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { productCategoryBySlug, productsByCategorySlug } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = productCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: `${category.english_name} | Lianteng Packaging Machinery`,
    description: category.summary,
    alternates: { canonical: `/products/category/${category.slug}` },
    openGraph: { title: `${category.english_name} | Lianteng Packaging Machinery`, description: category.summary, images: [category.image_url] },
  };
}

export default async function ProductCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = productCategoryBySlug(slug);
  if (!category) notFound();
  const list = productsByCategorySlug(slug);

  return (
    <>
      <div className="page-title">
        <p className="meta"><a href="/products">Products</a><span>{category.product_count} products</span></p>
        <h1>{category.english_name}</h1>
        <p>{category.summary}</p>
      </div>
      <section className="section compact">
        <div className="grid">
          {list.map((product) => (
            <article className="card" key={product.id}>
              <img className="media" src={product.image_url} alt={product.english_name} loading="lazy" />
              <div className="card-body">
                <span className="badge">{product.category_name}</span>
                <h3>{product.english_name}</h3>
                <p>{product.summary}</p>
                <a className="button secondary" href={`/products/${product.slug}`}>View product</a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
