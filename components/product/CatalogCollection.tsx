import Link from "next/link";
import { MagnifyingGlass, X } from "@phosphor-icons/react/ssr";
import { Pagination } from "@/components/Pagination";
import { ProductCatalogCard } from "@/components/product/ProductCatalogCard";
import type { resolveCatalog } from "@/lib/catalog-presentation";
import { productsPerPage } from "@/lib/pagination";

export function CatalogCollection({
  catalog, basePath, title, showCategory = false,
}: {
  catalog: ReturnType<typeof resolveCatalog>;
  basePath: string;
  title: string;
  showCategory?: boolean;
}) {
  const { search, products, total, pageCount, resolution: { page } } = catalog;
  const first = (page - 1) * productsPerPage + 1;
  return (
    <section className="cw-section cw-catalog-collection" id="catalog" aria-labelledby="catalog-heading">
      <div className="cw-wrap">
        <div className="cw-catalog-toolbar">
          <div>
            <h2 id="catalog-heading">{search ? "Search results" : title}</h2>
            <p>{total ? `Showing ${first}-${first + products.length - 1} of ${total} models` : "0 matching models"}</p>
          </div>
          <form role="search" aria-label="Find equipment by name or model" action={basePath} method="get" className="cw-catalog-search">
            <label className="cw-search-field">
              <MagnifyingGlass aria-hidden="true" size={19} />
              <span className="sr-only">Equipment name or model</span>
              <input type="search" name="q" defaultValue={search} maxLength={100} placeholder="Equipment name or model" />
            </label>
            <button className="cw-btn cw-btn-dark" type="submit">Search</button>
          </form>
        </div>
        {search && <div className="cw-search-context"><span>Search: <strong>{search}</strong></span><Link className="cw-link" href={basePath}><X size={16} aria-hidden="true" />Clear search</Link></div>}
        {products.length ? (
          <div className="cw-catalog-grid">
            {products.map((product) => <ProductCatalogCard key={product.id} product={product} showCategory={showCategory} />)}
          </div>
        ) : (
          <div className="cw-empty">
            <MagnifyingGlass size={32} aria-hidden="true" />
            <h3>{search ? "No equipment matches this search" : "No models in this family yet"}</h3>
            <Link className="cw-link" href={search ? basePath : "/products"}>{search ? "Show all models" : "Browse all equipment"}</Link>
          </div>
        )}
        <Pagination basePath={basePath} currentPage={page} totalPages={pageCount} query={search ? { q: search } : undefined} ariaLabel="Equipment catalog pagination" />
      </div>
    </section>
  );
}
