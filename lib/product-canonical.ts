import audit from "@/data/product-audit/canonical-product-master.json";

type AuditProduct = {
  productStatus: string;
  currentUrls: string[];
};

function pathname(value: string) {
  try {
    return new URL(value).pathname;
  } catch {
    return value.startsWith("/") ? value : `/${value}`;
  }
}

const aliasToCanonical = new Map<string, string>();

for (const entry of audit.products as AuditProduct[]) {
  if (entry.productStatus !== "duplicate" || entry.currentUrls.length < 2) continue;
  const [canonicalUrl, ...aliases] = entry.currentUrls;
  const canonicalPath = pathname(canonicalUrl);
  for (const alias of aliases) aliasToCanonical.set(pathname(alias), canonicalPath);
}

export function productPath(category: string, slug: string) {
  return `/products/${category}/${slug}`;
}

export function getProductCanonicalRedirect(category: string, slug: string) {
  return aliasToCanonical.get(productPath(category, slug)) ?? null;
}

export function isCanonicalProductRoute(product: { category: string; slug: string }) {
  return !getProductCanonicalRedirect(product.category, product.slug);
}

export const duplicateProductRedirectCount = aliasToCanonical.size;
