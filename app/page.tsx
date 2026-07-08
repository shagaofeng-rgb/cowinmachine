import { articles, products } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const productList = products();
  const news = articles("news", 3);
  return (
    <>
      <section className="hero">
        <div>
          <h1>Packaging machinery for overseas B2B production lines</h1>
          <p>Lianteng helps manufacturers choose vertical packing, sealing and coding equipment with clear product data, inquiry capture, News insights and SEO-ready content.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a className="button" href="/products">View Products</a>
            <a className="button secondary" href="/contact">Request Quote</a>
          </div>
        </div>
        <img className="media" src={productList[0]?.image_url} alt="Packaging machinery production line" />
      </section>
      <section className="section">
        <div className="section-title"><h2>Featured Products</h2><a href="/products">All products</a></div>
        <div className="grid">
          {productList.slice(0, 3).map((product) => (
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
