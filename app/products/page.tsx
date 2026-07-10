import type { Metadata } from "next";
import { productCategories, products } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse Lianteng packaging machinery products, categories and inquiry-ready product pages.",
};

export default function ProductsPage() {
  const categories = productCategories();
  const allProducts = products();
  return (
    <>
      <div className="page-title">
        <h1>Products</h1>
        <p>{`${allProducts.length} migrated Lianteng products across ${categories.length} packaging machinery categories.`}</p>
      </div>
      <section className="section">
        <div className="category-strip">
          <a className="category-chip active" href="/products"><span>All Products</span><strong>{allProducts.length}</strong></a>
          {categories.map((item) => (
            <a className="category-chip" href={`/products/category/${item.slug}`} key={item.slug}>
              <span>{item.english_name}</span>
              <strong>{item.product_count}</strong>
            </a>
          ))}
        </div>
      </section>
      <section className="section compact">
        <div className="grid">
          {allProducts.map((product) => (
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
