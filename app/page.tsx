import { articles, productCategories, products } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const productList = products();
  const categories = productCategories();
  const news = articles("news", 3);
  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">Wenzhou Lianteng Packaging Machinery Co., LTD</span>
          <h1>Packaging machinery and automated packing line solutions</h1>
          <p>Lianteng focuses on the R&D, production and sales of packaging machinery, from single machines to fully automated packaging assembly lines for food, pharmaceutical, chemical and daily commodity industries.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a className="button" href="/products">View {productList.length} Products</a>
            <a className="button secondary" href="/contact">Get a Quote</a>
          </div>
        </div>
        <img className="media" src={productList[0]?.image_url || "https://www.ltpk.com/uploads/2508/prpoducts-banner.jpg"} alt="Lianteng packaging machinery" />
      </section>
      <section className="section compact">
        <div className="stats">
          <div><strong>2010</strong><span>Established</span></div>
          <div><strong>{categories.length}</strong><span>Catalog Categories</span></div>
          <div><strong>{productList.length}</strong><span>Migrated Products</span></div>
          <div><strong>One-stop</strong><span>Design, manufacturing, installation and service</span></div>
        </div>
      </section>
      <section className="section">
        <div className="section-title"><h2>Original LTPK Product Categories</h2><a href="/products">All products</a></div>
        <div className="category-strip">
          {categories.slice(0, 12).map((category) => (
            <a className="category-chip" href={`/products?category=${category.slug}`} key={category.slug}>
              <span>{category.english_name}</span>
              <strong>{category.product_count}</strong>
            </a>
          ))}
        </div>
      </section>
      <section className="section alt">
        <div className="section-title"><h2>Featured Products</h2><a href="/products">All products</a></div>
        <div className="grid">
          {productList.slice(0, 12).map((product) => (
            <article className="card" key={product.id}>
              <img className="media" src={product.image_url} alt={product.english_name} />
              <div className="card-body">
                <span className="badge">{product.category_name}</span>
                <h3>{product.english_name}</h3>
                <p>{product.summary}</p>
                <a className="button secondary" href={`/products/${product.slug}`}>Details</a>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="section">
        <div className="section-title"><h2>Why Choose Lianteng</h2></div>
        <div className="grid">
          <article className="card"><div className="card-body"><h3>Best Selling Overseas</h3><p>Lianteng has professional machine production, sales and service experience, with customers and partners across global markets.</p></div></article>
          <article className="card"><div className="card-body"><h3>Professional Solutions</h3><p>Products serve food, chemical, daily necessities, pharmaceutical, agricultural and e-commerce packaging scenarios.</p></div></article>
          <article className="card"><div className="card-body"><h3>Factory Direct Supply</h3><p>Direct factory support helps customers configure machines, control costs and receive after-sales technical guidance.</p></div></article>
        </div>
      </section>
      <section className="section alt">
        <div className="section-title"><h2>News & Analysis</h2><a href="/news">News list</a></div>
        <div className="grid">
          {news.map((item) => (
            <article className="card" key={item.id}>
              <img className="media" src={item.cover_image_url} alt={item.cover_image_alt} />
              <div className="card-body">
                <h3>{item.title}</h3>
                <p>{item.excerpt}</p>
                <a className="button secondary" href={`/news/${item.slug}`}>Read news</a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
