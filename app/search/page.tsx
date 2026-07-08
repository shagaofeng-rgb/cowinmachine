import { articles, products } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.toLowerCase();
  const productResults = products().filter((p) => [p.english_name, p.summary, p.tags].join(" ").toLowerCase().includes(term));
  const newsResults = articles("news", 20).filter((a) => [a.title, a.excerpt, a.geo_summary].join(" ").toLowerCase().includes(term));
  const blogResults = articles("blog", 20).filter((a) => [a.title, a.excerpt, a.geo_summary].join(" ").toLowerCase().includes(term));
  return (
    <>
      <div className="page-title"><h1>Search</h1><p>Search products, News and Blog content.</p></div>
      <section className="section">
        <form className="form"><label>Keyword<input name="q" defaultValue={q} placeholder="packing machine" /></label><button className="button">Search</button></form>
        <h2>Results</h2>
        {!q && <p>Please enter a keyword.</p>}
        {q && productResults.length + newsResults.length + blogResults.length === 0 && <p>No results found.</p>}
        <ul>
          {productResults.map((p) => <li key={`p-${p.id}`}><a href={`/products/${p.slug}`}>{p.english_name}</a></li>)}
          {newsResults.map((a) => <li key={`n-${a.id}`}><a href={`/news/${a.slug}`}>{a.title}</a></li>)}
          {blogResults.map((a) => <li key={`b-${a.id}`}><a href={`/blog/${a.slug}`}>{a.title}</a></li>)}
        </ul>
      </section>
    </>
  );
}
