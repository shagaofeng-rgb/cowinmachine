import type { Metadata } from "next";
import { products } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse Lianteng packaging machinery products, categories and inquiry-ready product pages.",
};

export default function ProductsPage() {
  const list = products();
  return (
    <>
      <div className="page-title"><h1>Products</h1><p>Published product data is loaded from the persistent database with SEO fields and product relationships.</p></div>
      <section className="section">
        <div className="grid">
          {list.map((product) => (
            <article className="card" key={product.id}>
              <img className="media" src={product.image_url} alt={product.english_name} />
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
