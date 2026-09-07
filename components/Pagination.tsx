import Link from "next/link";

type PaginationProps = {
  basePath: string;
  currentPage: number;
  totalPages: number;
  query?: Record<string, string>;
  ariaLabel?: string;
};

function pageHref(basePath: string, page: number, query?: Record<string, string>) {
  const params = new URLSearchParams(query);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `${basePath}?${search}` : basePath;
}

function getPageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 2) return [1, 2, 3, totalPages];
  if (currentPage >= totalPages - 1) return [1, totalPages - 2, totalPages - 1, totalPages];
  return [1, currentPage - 1, currentPage, totalPages];
}

export function Pagination({ basePath, currentPage, totalPages, query, ariaLabel = "Pagination" }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageItems(currentPage, totalPages);
  return <nav className="product-pagination" aria-label={ariaLabel}>
    <Link className={`pagination-control${currentPage === 1 ? " pagination-control-disabled" : ""}`} href={pageHref(basePath, Math.max(1, currentPage - 1), query)} aria-disabled={currentPage === 1} tabIndex={currentPage === 1 ? -1 : undefined}>Previous</Link>
    <ol>
      {pages.map((page, index) => <li key={page}>
        {index > 0 && page - pages[index - 1] > 1 && <span className="pagination-ellipsis" aria-hidden="true">…</span>}
        <Link className={page === currentPage ? "pagination-page pagination-page-current" : "pagination-page"} href={pageHref(basePath, page, query)} aria-current={page === currentPage ? "page" : undefined}>{page}</Link>
      </li>)}
    </ol>
    <Link className={`pagination-control${currentPage === totalPages ? " pagination-control-disabled" : ""}`} href={pageHref(basePath, Math.min(totalPages, currentPage + 1), query)} aria-disabled={currentPage === totalPages} tabIndex={currentPage === totalPages ? -1 : undefined}>Next</Link>
  </nav>;
}
