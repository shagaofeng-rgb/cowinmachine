export const productsPerPage = 12;
export const newsPerPage = 9;
export const blogPerPage = 9;
export const contentOperationsPerPage = 20;

export type PageResolution = {
  page: number;
  valid: boolean;
  shouldRedirect: boolean;
};

export function getPageCount(itemCount: number, pageSize = productsPerPage) {
  return Math.max(1, Math.ceil(itemCount / pageSize));
}

export function resolvePage(value: string | undefined, pageCount: number): PageResolution {
  if (value === undefined) return { page: 1, valid: true, shouldRedirect: false };
  if (!/^\d+$/.test(value)) return { page: 1, valid: false, shouldRedirect: false };

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > pageCount) {
    return { page: 1, valid: false, shouldRedirect: false };
  }

  return {
    page: parsed,
    valid: true,
    shouldRedirect: parsed === 1 || value !== String(parsed),
  };
}

export function getCurrentPage(value: string | undefined, pageCount: number) {
  const resolution = resolvePage(value, pageCount);
  return resolution.valid ? resolution.page : 1;
}

export function paginateItems<T>(items: T[], page: number, pageSize = productsPerPage) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
