const resultsPath = "/catalog-results";

export function isCatalogResultsPath(pathname: string) {
  return pathname === resultsPath || pathname.startsWith(resultsPath + "/");
}

// Only searches and pagination need a server render; bare listing URLs stay prerendered.
export function catalogResultsDestination(method: string, { pathname, searchParams }: Pick<URL, "pathname" | "searchParams">) {
  if (method !== "GET" && method !== "HEAD") return undefined;
  if (!/^\/products(?:\/[^/]+)?$/.test(pathname)) return undefined;
  if (!searchParams.has("q") && !searchParams.has("page")) return undefined;
  return resultsPath + pathname.slice("/products".length);
}
