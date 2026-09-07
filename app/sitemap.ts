import type { MetadataRoute } from "next";
import {
  getPublishedBlogArticles,
  getPublishedNewsArticles,
} from "@/lib/content-automation/storage";
import { getPageCount } from "@/lib/pagination";
import { isCanonicalProductRoute } from "@/lib/product-canonical";
import { getProductDetailProfile } from "@/lib/product-detail-profiles";
import { productCategories, products } from "@/lib/products";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

function paginatedPaths(basePath: string, itemCount: number) {
  const totalPages = getPageCount(itemCount);
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => `${basePath}?page=${index + 2}`);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/products",
    "/solutions",
    "/solutions/construction-sites",
    "/solutions/mineral-processing-recycling",
    "/about",
    "/contact",
    "/request-a-quote",
    "/news",
    "/blog",
  ];
  const [newsArticles, blogArticles] = await Promise.all([
    getPublishedNewsArticles(),
    getPublishedBlogArticles(),
  ]);
  const canonicalProducts = products.filter(isCanonicalProductRoute);
  const indexableProducts = canonicalProducts.filter(
    (product) => getProductDetailProfile(product).publicationState === "full-technical-content",
  );
  const catalogPagination = paginatedPaths("/products", canonicalProducts.length);
  const categoryPagination = productCategories.flatMap((category) => {
    const itemCount = canonicalProducts.filter((product) => product.category === category.slug).length;
    return paginatedPaths(`/products/${category.slug}`, itemCount);
  });

  return [
    ...staticRoutes.map((path) => ({ url: siteConfig.siteUrl + path })),
    ...productCategories.map((category) => ({
      url: siteConfig.siteUrl + "/products/" + category.slug,
    })),
    ...[...catalogPagination, ...categoryPagination].map((path) => ({
      url: siteConfig.siteUrl + path,
    })),
    ...indexableProducts.map((product) => ({
      url: siteConfig.siteUrl + "/products/" + product.category + "/" + product.slug,
    })),
    ...newsArticles.map((article) => ({
      url: siteConfig.siteUrl + "/news/" + article.slug,
      lastModified: new Date(article.updatedAt),
    })),
    ...blogArticles.map((article) => ({
      url: siteConfig.siteUrl + "/blog/" + article.slug,
      lastModified: new Date(article.updatedAt),
    })),
  ];
}
