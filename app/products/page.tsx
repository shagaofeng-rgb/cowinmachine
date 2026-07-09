import type { Metadata } from "next";
import { productCategories, products } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse Lianteng packaging machinery products, categories and inquiry-ready product pages.",
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const categories = productCategories();
  const allProducts = products();
  const list = category ? allProducts.filter((product) => slugify(product.category_name || "") === category || categories.find((item) => item.slug === category)?.english_name === product.category_name) : allProducts;
  const activeCategory = categories.find((item) => item.slug === category);
  return (
    <>
      <div className="page-title">
        <h1>Products</h1>
        <p>{activeCategory ? `${activeCategory.english_name}: ${activeCategory.product_count} products from the original LTPK catalog.` : `${allProducts.length} migrated Lianteng products across ${categories.length} packaging machinery categories.`}</p>
      </div>
      <section className="section">
        <div className="category-strip">
          <a className={!category ? "category-chip active" : "category-chip"} href="/products"><span>All Products</span><strong>{allProducts.length}</strong></a>
          {categories.map((item) => (
            <a className={category === item.slug ? "category-chip active" : "category-chip"} href={`/products?category=${item.slug}`} key={item.slug}>
              <span>{item.english_name}</span>
              <strong>{item.product_count}</strong>
            </a>
          ))}
        </div>
      </section>
      <section className="section compact">
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

function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
