import { productPath } from "@/lib/product-sections";
import { getProductCanonicalRedirect } from "@/lib/product-canonical";
import { getProductDetailProfile } from "@/lib/product-detail-profiles";
import { getCategory, getProduct } from "@/lib/products";
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

export function resolveInquirySelection(value: string, categorySlug = "") {
  const url = normalizeInquiryProductUrl(value);
  const [, , requestedCategory = "", requestedSlug = ""] = url ? new URL(url).pathname.split("/") : [];
  const alias = requestedSlug && getProductCanonicalRedirect(requestedCategory, requestedSlug);
  const [, , category = requestedCategory, slug = requestedSlug] = alias ? alias.split("/") : [];
  const product = slug ? getProduct(category, slug) : undefined;
  if (product) {
    return {
      product,
      category: getCategory(product.category),
      model: getProductDetailProfile(product).model ?? "",
      productUrl: new URL(productPath(product), siteConfig.siteUrl).href,
    };
  }
  return { product: undefined, category: getCategory(categorySlug) ?? (!requestedSlug ? getCategory(requestedCategory) : undefined), model: "", productUrl: "" };
}
