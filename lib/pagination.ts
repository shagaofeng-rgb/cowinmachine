export const productsPerPage = 12;

export function getPageCount(itemCount: number, pageSize = productsPerPage) {
  return Math.max(1, Math.ceil(itemCount / pageSize));
}

export function getCurrentPage(value: string | undefined, pageCount: number) {
  const parsed = Number.parseInt(value ?? "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, pageCount);
}

export function paginateItems<T>(items: T[], page: number, pageSize = productsPerPage) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
