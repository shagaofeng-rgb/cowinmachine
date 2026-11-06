import { productPath } from "@/lib/product-sections";
import { siteConfig } from "@/lib/site";
import type { Product } from "@/types/product";

export function productQuoteHref(product: Product, model: string | null) {
  const query = new URLSearchParams({
    product: product.name,
    productUrl: productPath(product),
    category: product.category,
    ...(model ? { productModel: model } : {}),
  });
  return `/request-a-quote?${query}`;
}

export function normalizeInquiryProductUrl(value: string) {
  if (!value || value.length > 600) return "";
  const site = new URL(siteConfig.siteUrl);
  try {
    const url = new URL(value, site);
    const allowedHost = url.host === site.host || url.host === `www.${site.host}`;
    if (!allowedHost || !["http:", "https:"].includes(url.protocol) || url.username || url.password) return "";
    const path = url.pathname.replace(/\/$/, "");
    if (!/^\/products(?:\/[a-z0-9-]+){0,2}$/.test(path)) return "";
    return new URL(path, site).href;
  } catch {
    return "";
  }
}
