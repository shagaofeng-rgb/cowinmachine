import Link from "next/link";

type ProductPaginationProps = {
  basePath: string;
  currentPage: number;
  totalPages: number;
};

function pageHref(basePath: string, page: number) {
  return page === 1 ? basePath : `${basePath}?page=${page}`;
}

function getPageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  if (currentPage <= 3) [2, 3, 4, 5].forEach((page) => pages.add(page));
  if (currentPage >= totalPages - 2) [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1].forEach((page) => pages.add(page));
  return [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
}

export function ProductPagination({ basePath, currentPage, totalPages }: ProductPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageItems(currentPage, totalPages);
  return <nav className="product-pagination" aria-label="Product pagination">
    <Link className={`pagination-control${currentPage === 1 ? " pagination-control-disabled" : ""}`} href={pageHref(basePath, Math.max(1, currentPage - 1))} aria-disabled={currentPage === 1} tabIndex={currentPage === 1 ? -1 : undefined}>Previous</Link>
    <ol>
      {pages.map((page, index) => <li key={page}>
        {index > 0 && page - pages[index - 1] > 1 && <span className="pagination-ellipsis" aria-hidden="true">…</span>}
        <Link className={page === currentPage ? "pagination-page pagination-page-current" : "pagination-page"} href={pageHref(basePath, page)} aria-current={page === currentPage ? "page" : undefined}>{page}</Link>
      </li>)}
    </ol>
    <Link className={`pagination-control${currentPage === totalPages ? " pagination-control-disabled" : ""}`} href={pageHref(basePath, Math.min(totalPages, currentPage + 1))} aria-disabled={currentPage === totalPages} tabIndex={currentPage === totalPages ? -1 : undefined}>Next</Link>
  </nav>;
}
